import 'dart:io';

import 'package:dio/dio.dart';

import '../core/app_config.dart';
import '../models/app_models.dart';
import 'mobile_api.dart';

class DioMobileApi implements MobileApi {
  DioMobileApi({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: AppConfig.apiBaseUrl,
                connectTimeout: const Duration(seconds: 20),
                receiveTimeout: const Duration(seconds: 30),
                validateStatus: (_) => true,
              ),
            ) {
    // เขียนข้อมูล (POST/PATCH/...) → ทิ้ง export ที่ cache ไว้ ให้รอบถัดไปดึงข้อมูลใหม่
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      if (options.method.toUpperCase() != 'GET') _exportCache = null;
      handler.next(options);
    }));
  }

  final Dio _dio;

  /// export ทั้งก้อนใช้ทั้ง dashboard และรายการงาน — แชร์ผลภายใน 5 วินาที
  /// (เดิม refreshAll/upload/review ดาวน์โหลด export ซ้ำ 2 รอบต่อการกระทำ)
  static const _exportCacheTtl = Duration(seconds: 5);
  ({
    String token,
    DateTime at,
    Future<Map<String, dynamic>> payload
  })? _exportCache;

  @override
  Future<AuthSession> login(String username, String password) async {
    final csrfResponse = await _dio.get('/api/auth/csrf');
    _assertOk(csrfResponse, allowAnonymous: true);
    final csrf = csrfResponse.data as Map<String, dynamic>;
    final csrfCookie = _cookieHeaderFrom(csrfResponse.headers);
    final csrfToken = _str(csrf['csrfToken'] ?? '');
    final loginResponse = await _dio.post(
      '/api/auth/callback/credentials',
      data: {
        'csrfToken': csrfToken,
        'username': username,
        'password': password,
        'json': 'true',
      },
      options: Options(
        contentType: Headers.formUrlEncodedContentType,
        followRedirects: false,
        headers: csrfCookie.isEmpty ? null : {'Cookie': csrfCookie},
      ),
    );
    _assertOk(loginResponse, allowAnonymous: true);
    // next-auth ตอบ 200/302 แม้รหัสผิด — ดู ?error= ใน url/Location
    final loginData = loginResponse.data;
    final redirectUrl = loginData is Map
        ? _str(loginData['url'])
        : (loginResponse.headers.value('location') ?? '');
    if (redirectUrl.contains('error=')) {
      throw const ApiException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
          statusCode: 400);
    }
    final cookie = [csrfCookie, _cookieHeaderFrom(loginResponse.headers)]
        .where((part) => part.isNotEmpty)
        .join('; ');
    if (cookie.isEmpty) {
      throw const ApiException('เข้าสู่ระบบไม่สำเร็จ');
    }

    final user = await _currentUser(cookie);
    final projects = await _request<Map<String, dynamic>>(
      () => _dio.get('/api/projects', options: _cookieOptions(cookie)),
      tokenOverride: cookie,
    );
    final activeProjectId = _str(projects['activeProjectId'] ?? '');
    final tasksPayload = await _taskExport(cookie);
    final committees = _committeesFrom(tasksPayload);
    return AuthSession(
      token: cookie,
      user: user,
      projectId: activeProjectId,
      committees: committees,
    );
  }

  @override
  Future<DashboardData> dashboard(String token) async {
    // 3 คำขอไม่ขึ้นต่อกัน — ยิงพร้อมกัน (เดิมรอทีละอัน)
    final results = await Future.wait<Object>([
      _taskExport(token),
      _request<Map<String, dynamic>>(
        () => _dio.get('/api/projects', options: _cookieOptions(token)),
        tokenOverride: token,
      ),
      _currentUser(token),
    ]);
    final payload = results[0] as Map<String, dynamic>;
    final projects = results[1] as Map<String, dynamic>;
    final user = results[2] as AppUser;
    final project = _projectFrom(projects, payload);
    // ตัวเลขภาพรวมจาก server (ถ่วงน้ำหนัก verified เหมือนเว็บ) — เดิม hardcode งบ/วันงาน
    final overview = payload['overview'] as Map<String, dynamic>? ?? const {};
    final overviewBudget =
        overview['budget'] as Map<String, dynamic>? ?? const {};
    final projectJson = payload['project'] as Map<String, dynamic>? ?? const {};
    final eventStart = DateTime.tryParse(_str(projectJson['event_date']));
    final tasks = _tasksFromExport(payload);
    final committees = _committeesFrom(payload);
    final delayed = tasks.where((task) => task.isDelayed).length;
    final evidence = tasks.expand((task) => task.evidence).toList();
    final subtasks = tasks.expand((task) => task.subtasks).toList();
    final mySubtasks =
        subtasks.where((subtask) => subtask.ownerId == user.id).toList();
    final progress = tasks.isEmpty
        ? 0
        : (tasks.fold<int>(0, (sum, task) => sum + task.reportedProgress) /
                tasks.length)
            .round();
    final daysRemaining = overview['daysRemaining'] != null
        ? _int(overview['daysRemaining'])
        : (eventStart == null
            ? 0
            : eventStart.difference(DateTime.now()).inDays.clamp(0, 9999));
    return DashboardData(
      user: user,
      project: project,
      committees: committees,
      myKpi: MyKpi(
        subtasksTotal: mySubtasks.length,
        subtasksPending: mySubtasks
            .where((s) =>
                s.status != TaskStatus.done && s.status != TaskStatus.verified)
            .length,
        subtasksDelayed:
            mySubtasks.where((s) => s.status == TaskStatus.delayed).length,
        evidencePending: evidence
            .where((item) => item.status == EvidenceStatus.pending)
            .length,
        evidenceRejected: evidence
            .where((item) => item.status == EvidenceStatus.rejected)
            .length,
        committeeProgress: progress,
      ),
      projectKpi: ProjectKpi(
        overall:
            overview['overall'] != null ? _int(overview['overall']) : progress,
        totalTasks: overview['totalTasks'] != null
            ? _int(overview['totalTasks'])
            : tasks.length,
        delayedTasks: overview['delayedTasks'] != null
            ? _int(overview['delayedTasks'])
            : delayed,
        evidencePending: overview['evidencePending'] != null
            ? _int(overview['evidencePending'])
            : evidence
                .where((item) => item.status == EvidenceStatus.pending)
                .length,
        daysRemaining: daysRemaining,
        plannedBudget: _num(overviewBudget['planned']),
        actualBudget: _num(overviewBudget['actual']),
      ),
    );
  }

  @override
  Future<List<TaskItem>> myTasks(String token) async {
    return _tasksFromExport(await _taskExport(token));
  }

  @override
  Future<Subtask> updateSubtask({
    required String token,
    required String subtaskId,
    required TaskStatus status,
    required int reportedProgress,
  }) async {
    final json = await _request<Map<String, dynamic>>(
      () => _dio.patch(
        '/api/subtasks/$subtaskId',
        data: {
          'status': _statusToApi(status),
          'reported_progress': reportedProgress,
        },
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
    return _subtaskFromJson(json);
  }

  @override
  Future<Evidence> uploadEvidence({
    required String token,
    required String taskId,
    String? subtaskId,
    required String caption,
    required File file,
  }) async {
    final multipart = await MultipartFile.fromFile(file.path);
    final json = await _request<Map<String, dynamic>>(
      () => _dio.post(
        '/api/evidence/upload',
        data: FormData.fromMap({
          'task_id': taskId,
          if (subtaskId != null) 'subtask_id': subtaskId,
          'caption': caption,
          'file': multipart,
        }),
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
    return _evidenceFromJson(json);
  }

  @override
  Future<List<TaskComment>> taskComments(String token, String taskId) async {
    final json = await _request<Map<String, dynamic>>(
      () => _dio.get('/api/tasks/$taskId/comments',
          options: _cookieOptions(token)),
      tokenOverride: token,
    );
    final items = (json['items'] as List? ?? const []);
    return items
        .map((item) => _commentFromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<TaskComment> addTaskComment({
    required String token,
    required String taskId,
    required String message,
  }) async {
    final json = await _request<Map<String, dynamic>>(
      () => _dio.post(
        '/api/tasks/$taskId/comments',
        data: {'body': message},
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
    return _commentFromJson(json);
  }

  @override
  Future<TaskItem> updateTaskStatus({
    required String token,
    required String taskId,
    required TaskStatus status,
  }) async {
    await _request<Map<String, dynamic>>(
      () => _dio.patch(
        '/api/tasks/$taskId',
        data: {'status': _statusToApi(status)},
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
    final tasks = await myTasks(token);
    return tasks.firstWhere((task) => task.id == taskId);
  }

  @override
  Future<Evidence> reviewEvidence({
    required String token,
    required String evidenceId,
    required bool approved,
    String? rejectionReason,
  }) async {
    final json = await _request<Map<String, dynamic>>(
      () => _dio.post(
        '/api/evidence/review',
        data: {
          'id': evidenceId,
          'status': approved ? 'APPROVED' : 'REJECTED',
          if (rejectionReason != null) 'rejection_reason': rejectionReason,
        },
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
    return _evidenceFromJson(json);
  }

  @override
  Future<List<AppNotification>> notifications(String token) async {
    final json = await _request<Map<String, dynamic>>(
      () => _dio.get('/api/notifications', options: _cookieOptions(token)),
      tokenOverride: token,
    );
    final items = (json['items'] as List? ?? const []);
    return items
        .map((item) => _notificationFromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> markNotificationRead(String token, String notificationId) async {
    await _request<Map<String, dynamic>>(
      () => _dio.patch(
        '/api/notifications',
        data: {'id': notificationId},
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
  }

  @override
  Future<AppUser> updateProfile({
    required String token,
    required String name,
    required String username,
    String? currentPassword,
    String? password,
  }) async {
    final json = await _request<Map<String, dynamic>>(
      () => _dio.patch(
        '/api/users/me',
        data: {
          'name': name,
          'username': username,
          if (currentPassword != null) 'current_password': currentPassword,
          if (password != null) 'password': password,
        },
        options: _cookieOptions(token),
      ),
      tokenOverride: token,
    );
    final session = await _session(token);
    return _userFrom(json, session);
  }

  Future<Map<String, dynamic>> _taskExport(String token) {
    final cached = _exportCache;
    if (cached != null &&
        cached.token == token &&
        DateTime.now().difference(cached.at) < _exportCacheTtl) {
      return cached.payload;
    }
    final payload = _request<Map<String, dynamic>>(
      () => _dio.get('/api/tasks/export?format=json',
          options: _cookieOptions(token)),
      tokenOverride: token,
    );
    _exportCache = (token: token, at: DateTime.now(), payload: payload);
    // ล้มเหลว → ไม่ cache ความผิดพลาดไว้
    payload.catchError((Object _) {
      if (identical(_exportCache?.payload, payload)) _exportCache = null;
      return const <String, dynamic>{};
    });
    return payload;
  }

  Future<AppUser> _currentUser(String token) async {
    final userJson = await _request<Map<String, dynamic>>(
      () => _dio.get('/api/users/me', options: _cookieOptions(token)),
      tokenOverride: token,
    );
    final sessionJson = await _session(token);
    return _userFrom(userJson, sessionJson);
  }

  Future<Map<String, dynamic>> _session(String token) {
    return _request<Map<String, dynamic>>(
      () => _dio.get('/api/auth/session', options: _cookieOptions(token)),
      tokenOverride: token,
    );
  }

  Options _cookieOptions(String token) {
    return Options(headers: {'Cookie': token}, followRedirects: false);
  }

  String _cookieHeaderFrom(Headers headers) {
    final raw = headers.map['set-cookie'] ?? const <String>[];
    final cookies = <String>[];
    for (final value in raw) {
      final first = value.split(';').first.trim();
      if (first.isNotEmpty) cookies.add(first);
    }
    return cookies.join('; ');
  }

  Future<T> _request<T>(
    Future<Response<dynamic>> Function() call, {
    bool allowAnonymous = false,
    String? tokenOverride,
  }) async {
    try {
      final response = await call();
      _assertOk(response, allowAnonymous: allowAnonymous);
      return response.data as T;
    } on DioException catch (error) {
      if (error.response != null) {
        _assertOk(error.response!, allowAnonymous: allowAnonymous);
      }
      throw const ApiException('ไม่มีการเชื่อมต่อ');
    } on SocketException {
      throw const ApiException('ไม่มีการเชื่อมต่อ');
    }
  }

  void _assertOk(Response<dynamic> response, {bool allowAnonymous = false}) {
    final status = response.statusCode ?? 0;
    if (status >= 200 && status < 300) return;
    // redirect ไปหน้า login = session หมดอายุ → ให้ AppState logout (จัดการที่ 401)
    if (!allowAnonymous && status >= 300 && status < 400) {
      throw const ApiException('กรุณาเข้าสู่ระบบใหม่', statusCode: 401);
    }
    final message = _messageFromResponse(response, status);
    throw ApiException(message, statusCode: status);
  }

  String _messageFromResponse(Response<dynamic> response, int status) {
    final data = response.data;
    if (data is Map && data['error'] != null) {
      return _str(data['error']);
    }
    if (status == 401 || status == 307) {
      return 'กรุณาเข้าสู่ระบบใหม่';
    }
    if (status == 403) return 'ไม่มีสิทธิ์';
    if (status == 400) {
      return 'ข้อมูลไม่ถูกต้อง';
    }
    return 'เชื่อมต่อระบบไม่สำเร็จ';
  }

  AppUser _userFrom(
      Map<String, dynamic> userJson, Map<String, dynamic> sessionJson) {
    final sessionUser =
        sessionJson['user'] as Map<String, dynamic>? ?? const {};
    final roles = (sessionUser['roles'] as List? ?? const []);
    return AppUser(
      id: _str(userJson['id'] ?? sessionUser['id'] ?? ''),
      name: _str(userJson['name'] ?? sessionUser['name'] ?? ''),
      username: _str(userJson['username'] ?? ''),
      role: roles.isEmpty ? 'Task Owner' : _str(roles.first),
    );
  }

  ProjectInfo _projectFrom(
      Map<String, dynamic> projectsJson, Map<String, dynamic> exportJson) {
    final project = exportJson['project'] as Map<String, dynamic>? ?? const {};
    return ProjectInfo(
      id: _str(project['id'] ?? projectsJson['activeProjectId'] ?? ''),
      name: _str(project['name'] ?? '329 MIS'),
      edition: _str(project['edition'] ?? '2570'),
    );
  }

  List<Committee> _committeesFrom(Map<String, dynamic> payload) {
    final committees = payload['committees'] as List?;
    if (committees != null && committees.isNotEmpty) {
      return committees.map((item) {
        final json = item as Map<String, dynamic>;
        return Committee(
            id: _str(json['id'] ?? json['name']),
            name: _str(json['name'] ?? 'คณะกรรมการ'));
      }).toList();
    }
    final tasks = payload['tasks'] as List? ?? const [];
    final byId = <String, Committee>{};
    for (final item in tasks) {
      final committee = (item as Map<String, dynamic>)['committee']
              as Map<String, dynamic>? ??
          const {};
      final id = _str(committee['id'] ?? committee['name'] ?? '');
      if (id.isEmpty) continue;
      byId[id] =
          Committee(id: id, name: _str(committee['name'] ?? 'คณะกรรมการ'));
    }
    return byId.values.toList();
  }

  List<TaskItem> _tasksFromExport(Map<String, dynamic> payload) {
    final tasks = payload['tasks'] as List?;
    if (tasks != null) {
      return tasks
          .map((item) => _taskFromJson(item as Map<String, dynamic>))
          .toList();
    }
    final rows = payload['rows'] as List? ?? const [];
    return rows.map((item) {
      final row = item as Map<String, dynamic>;
      final code = _str(row['task_code'] ?? '');
      return TaskItem(
        id: code,
        code: code,
        title: _str(row['task_title'] ?? ''),
        description: _str(row['task_description'] ?? ''),
        committee: Committee(
          id: _str(row['committee_name'] ?? ''),
          name: _str(row['committee_name'] ?? ''),
        ),
        ownerId: null,
        dueDate: DateTime(2027, 3, 29),
        status: TaskStatus.notStarted,
        reportedProgress: 0,
        subtasks: const [],
        evidence: const [],
        comments: const [],
      );
    }).toList();
  }

  TaskItem _taskFromJson(Map<String, dynamic> json) {
    final committeeJson =
        json['committee'] as Map<String, dynamic>? ?? const {};
    return TaskItem(
      id: _str(json['id'] ?? ''),
      code: _str(json['code'] ?? ''),
      title: _str(json['title'] ?? ''),
      description: _str(json['description'] ?? ''),
      committee: Committee(
        id: _str(committeeJson['id'] ?? ''),
        name: _str(committeeJson['name'] ?? ''),
      ),
      ownerId: _strOrNull(json['owner_id']),
      dueDate: DateTime.tryParse(_str(json['due_date'] ?? '')) ??
          DateTime(2027, 3, 29),
      status: _statusFromApi(json['status']),
      reportedProgress: _int(json['reported_progress']),
      subtasks: (json['subtasks'] as List? ?? const [])
          .map((item) => _subtaskFromJson(item as Map<String, dynamic>))
          .toList(),
      evidence: (json['evidence'] as List? ?? const [])
          .map((item) => _evidenceFromJson(item as Map<String, dynamic>))
          .toList(),
      comments: (json['comments'] as List? ?? const [])
          .map((item) => _commentFromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Subtask _subtaskFromJson(Map<String, dynamic> json) {
    return Subtask(
      id: _str(json['id'] ?? ''),
      title: _str(json['title'] ?? ''),
      ownerId: _strOrNull(json['owner_id']),
      status: _statusFromApi(json['status']),
      reportedProgress: _int(json['reported_progress']),
    );
  }

  Evidence _evidenceFromJson(Map<String, dynamic> json) {
    return Evidence(
      id: _str(json['id'] ?? ''),
      caption: _str(json['caption'] ?? ''),
      status: _evidenceStatusFromApi(json['status']),
      createdAt:
          DateTime.tryParse(_str(json['created_at'] ?? '')) ?? DateTime.now(),
      reviewerName:
          _strOrNull(json['reviewer_name']) ?? _strOrNull(json['reviewed_by']),
      rejectionReason: _strOrNull(json['rejection_reason']),
    );
  }

  TaskComment _commentFromJson(Map<String, dynamic> json) {
    return TaskComment(
      id: _str(json['id'] ?? ''),
      authorName: _str(json['author_name'] ?? json['user_id'] ?? 'ผู้ใช้'),
      message: _str(json['body'] ?? json['message'] ?? ''),
      createdAt:
          DateTime.tryParse(_str(json['created_at'] ?? '')) ?? DateTime.now(),
    );
  }

  AppNotification _notificationFromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: _str(json['id'] ?? ''),
      title: _str(json['title'] ?? ''),
      body: _str(json['body'] ?? ''),
      createdAt:
          DateTime.tryParse(_str(json['created_at'] ?? '')) ?? DateTime.now(),
      read: json['read_at'] != null,
      taskId: _extractTaskId(json),
    );
  }

  String? _extractTaskId(Map<String, dynamic> json) {
    final meta = json['metadata'];
    if (meta is Map && meta['task_id'] != null) return _str(meta['task_id']);
    if (json['task_id'] != null) return _str(json['task_id']);
    return null;
  }

  TaskStatus _statusFromApi(dynamic value) {
    return switch (_str(value)) {
      'IN_PROGRESS' => TaskStatus.inProgress,
      'SUBMITTED' => TaskStatus.submitted,
      'REVISION_REQUIRED' => TaskStatus.revisionRequired,
      'VERIFIED' => TaskStatus.verified,
      'DONE' => TaskStatus.done,
      'DELAYED' => TaskStatus.delayed,
      _ => TaskStatus.notStarted,
    };
  }

  String _statusToApi(TaskStatus status) {
    return switch (status) {
      TaskStatus.notStarted => 'NOT_STARTED',
      TaskStatus.inProgress => 'IN_PROGRESS',
      TaskStatus.submitted => 'SUBMITTED',
      TaskStatus.revisionRequired => 'REVISION_REQUIRED',
      TaskStatus.verified => 'VERIFIED',
      TaskStatus.done => 'DONE',
      TaskStatus.delayed => 'DELAYED',
    };
  }

  EvidenceStatus _evidenceStatusFromApi(dynamic value) {
    return switch (_str(value)) {
      'APPROVED' => EvidenceStatus.approved,
      'REJECTED' => EvidenceStatus.rejected,
      _ => EvidenceStatus.pending,
    };
  }

  int _int(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.round();
    return num.tryParse(_str(value))?.round() ?? 0;
  }

  num _num(dynamic value) {
    if (value is num) return value;
    return num.tryParse(_str(value)) ?? 0;
  }

  String? _strOrNull(dynamic value) {
    final text = value?.toString();
    return text == null || text.isEmpty ? null : text;
  }

  String _str(dynamic value) {
    return value?.toString() ?? '';
  }
}
