import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';

import '../models/app_models.dart';
import '../services/mobile_api.dart';

class AppState extends ChangeNotifier {
  AppState({required MobileApi api}) : _api = api;

  final MobileApi _api;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  bool isBooting = true;
  bool isBusy = false;
  bool isOffline = false;
  String? errorMessage;
  AuthSession? session;
  DashboardData? dashboardData;
  List<TaskItem> tasks = [];
  List<AppNotification> notifications = [];

  bool get isAuthenticated => session != null;
  bool get isCommitteeLead => session?.user.role == 'Committee Lead';
  bool get canReviewEvidence {
    final role = session?.user.role;
    return role == 'Evidence Reviewer' ||
        role == 'Project Director' ||
        role == 'Committee Lead';
  }

  Future<void> restoreSession() async {
    final raw = await _storage.read(key: 'mock_session');
    if (raw != null) {
      // ใช้ session cookie ที่เก็บไว้ — ไม่ login ซ้ำด้วยรหัสผ่าน (หมดอายุ → 401 → logout)
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final user = data['user'] as Map<String, dynamic>? ?? const {};
      final token = data['token'] as String?;
      if (token != null && token.isNotEmpty) {
        session = AuthSession(
          token: token,
          projectId: data['projectId'] as String? ?? '',
          committees: (data['committees'] as List? ?? const [])
              .map((c) => Committee(
                    id: (c as Map)['id']?.toString() ?? '',
                    name: c['name']?.toString() ?? '',
                  ))
              .toList(),
          user: AppUser(
            id: user['id'] as String? ?? '',
            name: user['name'] as String? ?? '',
            username: user['username'] as String? ?? '',
            role: user['role'] as String? ?? 'Task Owner',
          ),
        );
        try {
          await _guard(refreshAll, silent: true);
        } catch (_) {
          // _guard จัดการ logout/ข้อความแล้ว
        }
      } else {
        await _storage.delete(key: 'mock_session');
      }
    }
    isBooting = false;
    notifyListeners();
  }

  Future<void> login(String username, String password,
      {bool silent = false}) async {
    await _guard(() async {
      session = await _api.login(username.trim(), password);
      await _storage.write(
        key: 'mock_session',
        value: jsonEncode({
          'token': session!.token,
          'projectId': session!.projectId,
          'committees': session!.committees
              .map((c) => {'id': c.id, 'name': c.name})
              .toList(),
          'user': {
            'id': session!.user.id,
            'name': session!.user.name,
            'username': session!.user.username,
            'role': session!.user.role,
          },
        }),
      );
      await refreshAll();
    }, silent: silent);
  }

  Future<void> refreshAll() async {
    final token = session?.token;
    if (token == null) return;
    // ยิงพร้อมกัน — dashboard กับ myTasks ใช้ export ชุดเดียวกัน (cache ใน DioMobileApi)
    final results = await Future.wait<Object>([
      _api.dashboard(token),
      _api.myTasks(token),
      _api.notifications(token),
    ]);
    dashboardData = results[0] as DashboardData;
    tasks = results[1] as List<TaskItem>;
    notifications = results[2] as List<AppNotification>;
    notifyListeners();
  }

  Future<void> updateSubtask(
      Subtask subtask, TaskStatus status, int progress) async {
    final token = session!.token;
    await _guard(() async {
      await _api.updateSubtask(
        token: token,
        subtaskId: subtask.id,
        status: status,
        reportedProgress: progress,
      );
      tasks = await _api.myTasks(token);
    });
  }

  Future<void> uploadEvidence({
    required String taskId,
    String? subtaskId,
    required String caption,
    required File file,
  }) async {
    final token = session!.token;
    await _guard(() async {
      await _api.uploadEvidence(
        token: token,
        taskId: taskId,
        subtaskId: subtaskId,
        caption: caption,
        file: file,
      );
      tasks = await _api.myTasks(token);
      dashboardData = await _api.dashboard(token);
    });
  }

  Future<void> addTaskComment(String taskId, String message) async {
    final token = session!.token;
    await _guard(() async {
      await _api.addTaskComment(token: token, taskId: taskId, message: message);
      tasks = await _api.myTasks(token);
    });
  }

  Future<void> updateTaskStatus(String taskId, TaskStatus status) async {
    final token = session!.token;
    await _guard(() async {
      await _api.updateTaskStatus(token: token, taskId: taskId, status: status);
      tasks = await _api.myTasks(token);
    });
  }

  Future<void> reviewEvidence({
    required String evidenceId,
    required bool approved,
    String? rejectionReason,
  }) async {
    final token = session!.token;
    await _guard(() async {
      await _api.reviewEvidence(
        token: token,
        evidenceId: evidenceId,
        approved: approved,
        rejectionReason: rejectionReason,
      );
      tasks = await _api.myTasks(token);
      dashboardData = await _api.dashboard(token);
    });
  }

  Future<void> markNotificationRead(AppNotification item) async {
    await _guard(() async {
      await _api.markNotificationRead(session!.token, item.id);
      notifications = await _api.notifications(session!.token);
    });
  }

  Future<void> updateProfile({
    required String name,
    required String username,
    String? currentPassword,
    String? password,
  }) async {
    await _guard(() async {
      final user = await _api.updateProfile(
        token: session!.token,
        name: name,
        username: username,
        currentPassword: currentPassword,
        password: password,
      );
      session = AuthSession(
        token: session!.token,
        user: user,
        projectId: session!.projectId,
        committees: session!.committees,
      );
      dashboardData = await _api.dashboard(session!.token);
    });
  }

  Future<void> logout() async {
    session = null;
    dashboardData = null;
    tasks = [];
    notifications = [];
    await _storage.delete(key: 'mock_session');
    notifyListeners();
  }

  TaskItem? taskById(String? id) {
    if (id == null) return null;
    for (final task in tasks) {
      if (task.id == id) return task;
    }
    return null;
  }

  Future<void> _guard(Future<void> Function() action,
      {bool silent = false}) async {
    isBusy = true;
    if (!silent) errorMessage = null;
    notifyListeners();
    try {
      await action();
    } catch (error) {
      if (error is ApiException && error.statusCode == 401) {
        await logout();
      }
      isOffline = error is ApiException && error.statusCode == null;
      if (error is ApiException && error.statusCode == 403) {
        errorMessage = 'ไม่มีสิทธิ์';
      } else {
        errorMessage = error.toString().replaceFirst('Exception: ', '');
      }
      rethrow;
    } finally {
      isBusy = false;
      notifyListeners();
    }
  }
}
