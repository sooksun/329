import 'dart:io';

import '../models/app_models.dart';
import 'mobile_api.dart';

class MockMobileApi implements MobileApi {
  AuthSession? _session;
  late DashboardData _dashboardData;
  late List<TaskItem> _tasks;
  late List<AppNotification> _notifications;

  MockMobileApi() {
    _seed('kl_staff');
  }

  @override
  Future<AuthSession> login(String username, String password) async {
    await Future<void>.delayed(const Duration(milliseconds: 450));
    final valid = (username == 'kl_staff' && password == 'Pass329!') ||
        (username == 'kl_lead' && password == 'Pass329!') ||
        (username == 'reviewer' && password == 'Pass329!') ||
        (username == 'director' && password == 'password123');
    if (!valid) {
      throw Exception('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
    _seed(username);
    _session = AuthSession(
      token: 'mock-token-$username',
      user: _dashboardData.user,
      projectId: _dashboardData.project.id,
      committees: _dashboardData.committees,
    );
    return _session!;
  }

  @override
  Future<DashboardData> dashboard(String token) async {
    _assertToken(token);
    return _dashboardData;
  }

  @override
  Future<List<TaskItem>> myTasks(String token) async {
    _assertToken(token);
    return List.unmodifiable(_tasks);
  }

  @override
  Future<Subtask> updateSubtask({
    required String token,
    required String subtaskId,
    required TaskStatus status,
    required int reportedProgress,
  }) async {
    _assertToken(token);
    if (reportedProgress < 0 || reportedProgress > 100) {
      throw Exception('ความคืบหน้าต้องอยู่ระหว่าง 0 ถึง 100');
    }
    for (var taskIndex = 0; taskIndex < _tasks.length; taskIndex++) {
      final task = _tasks[taskIndex];
      final subIndex = task.subtasks.indexWhere((s) => s.id == subtaskId);
      if (subIndex == -1) continue;
      final subtask = task.subtasks[subIndex];
      if (subtask.ownerId != _dashboardData.user.id) {
        throw Exception('แก้ไขได้เฉพาะงานย่อยที่คุณรับผิดชอบ');
      }
      final updated = subtask.copyWith(
        status: status,
        reportedProgress: reportedProgress,
      );
      final subtasks = [...task.subtasks]..[subIndex] = updated;
      final average =
          subtasks.fold<int>(0, (sum, s) => sum + s.reportedProgress) ~/
              subtasks.length;
      _tasks[taskIndex] = task.copyWith(
        subtasks: subtasks,
        reportedProgress: average,
        status: status,
      );
      return updated;
    }
    throw Exception('ไม่พบงานย่อย');
  }

  @override
  Future<Evidence> uploadEvidence({
    required String token,
    required String taskId,
    String? subtaskId,
    required String caption,
    required File file,
  }) async {
    _assertToken(token);
    final cleanCaption = caption.trim();
    if (cleanCaption.isEmpty) throw Exception('กรุณากรอกคำอธิบายหลักฐาน');
    final size = await file.length();
    if (size > 10 * 1024 * 1024) throw Exception('ไฟล์ต้องมีขนาดไม่เกิน 10 MB');
    final name = file.path.toLowerCase();
    final allowed = name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.pdf');
    if (!allowed) throw Exception('รองรับเฉพาะ jpg, png หรือ pdf');
    final taskIndex = _tasks.indexWhere((task) => task.id == taskId);
    if (taskIndex == -1) throw Exception('ไม่พบภารกิจ');
    final task = _tasks[taskIndex];
    final evidence = Evidence(
      id: 'ev-${DateTime.now().millisecondsSinceEpoch}',
      caption: cleanCaption,
      status: EvidenceStatus.pending,
      createdAt: DateTime.now(),
    );
    _tasks[taskIndex] = task.copyWith(evidence: [evidence, ...task.evidence]);
    return evidence;
  }

  @override
  Future<List<TaskComment>> taskComments(String token, String taskId) async {
    _assertToken(token);
    final task = _tasks.firstWhere((task) => task.id == taskId);
    return List.unmodifiable(task.comments);
  }

  @override
  Future<TaskComment> addTaskComment({
    required String token,
    required String taskId,
    required String message,
  }) async {
    _assertToken(token);
    final clean = message.trim();
    if (clean.isEmpty) throw Exception('กรุณากรอกความคิดเห็น');
    final taskIndex = _tasks.indexWhere((task) => task.id == taskId);
    if (taskIndex == -1) throw Exception('ไม่พบภารกิจ');
    final comment = TaskComment(
      id: 'cm-${DateTime.now().millisecondsSinceEpoch}',
      authorName: _dashboardData.user.name,
      message: clean,
      createdAt: DateTime.now(),
    );
    final task = _tasks[taskIndex];
    _tasks[taskIndex] = task.copyWith(comments: [comment, ...task.comments]);
    return comment;
  }

  @override
  Future<TaskItem> updateTaskStatus({
    required String token,
    required String taskId,
    required TaskStatus status,
  }) async {
    _assertToken(token);
    if (_dashboardData.user.role != 'Committee Lead') {
      throw Exception('เฉพาะหัวหน้าฝ่ายเท่านั้นที่อัปเดตสถานะภารกิจได้');
    }
    final taskIndex = _tasks.indexWhere((task) => task.id == taskId);
    if (taskIndex == -1) throw Exception('ไม่พบภารกิจ');
    final updated = _tasks[taskIndex].copyWith(status: status);
    _tasks[taskIndex] = updated;
    return updated;
  }

  @override
  Future<Evidence> reviewEvidence({
    required String token,
    required String evidenceId,
    required bool approved,
    String? rejectionReason,
  }) async {
    _assertToken(token);
    final role = _dashboardData.user.role;
    final allowed = role == 'Evidence Reviewer' ||
        role == 'Project Director' ||
        role == 'Committee Lead';
    if (!allowed) throw Exception('ไม่มีสิทธิ์ตรวจหลักฐาน');
    final reason = rejectionReason?.trim();
    if (!approved && (reason == null || reason.isEmpty)) {
      throw Exception('กรุณากรอกเหตุผลที่ปฏิเสธ');
    }
    for (var taskIndex = 0; taskIndex < _tasks.length; taskIndex++) {
      final task = _tasks[taskIndex];
      final evidenceIndex =
          task.evidence.indexWhere((item) => item.id == evidenceId);
      if (evidenceIndex == -1) continue;
      final updated = task.evidence[evidenceIndex].copyWith(
        status: approved ? EvidenceStatus.approved : EvidenceStatus.rejected,
        reviewerName: _dashboardData.user.name,
        rejectionReason: approved ? null : reason,
        clearRejectionReason: approved,
      );
      final evidence = [...task.evidence]..[evidenceIndex] = updated;
      _tasks[taskIndex] = task.copyWith(evidence: evidence);
      return updated;
    }
    throw Exception('ไม่พบหลักฐาน');
  }

  @override
  Future<List<AppNotification>> notifications(String token) async {
    _assertToken(token);
    return List.unmodifiable(_notifications);
  }

  @override
  Future<void> markNotificationRead(String token, String notificationId) async {
    _assertToken(token);
    _notifications = _notifications
        .map((item) =>
            item.id == notificationId ? item.copyWith(read: true) : item)
        .toList();
  }

  @override
  Future<AppUser> updateProfile({
    required String token,
    required String name,
    required String username,
    String? currentPassword,
    String? password,
  }) async {
    _assertToken(token);
    if (name.trim().isEmpty || username.trim().isEmpty) {
      throw Exception('กรุณากรอกชื่อและชื่อผู้ใช้');
    }
    if (password != null && password.isNotEmpty && currentPassword == null) {
      throw Exception('กรุณากรอกรหัสผ่านปัจจุบัน');
    }
    final user = AppUser(
      id: _dashboardData.user.id,
      name: name.trim(),
      username: username.trim(),
      role: _dashboardData.user.role,
    );
    _dashboardData = DashboardData(
      user: user,
      project: _dashboardData.project,
      committees: _dashboardData.committees,
      myKpi: _dashboardData.myKpi,
      projectKpi: _dashboardData.projectKpi,
    );
    return user;
  }

  void _assertToken(String token) {
    if (_session == null || token != _session!.token) {
      throw Exception('กรุณาเข้าสู่ระบบใหม่');
    }
  }

  void _seed(String username) {
    final isDirector = username == 'director';
    final isLead = username == 'kl_lead';
    final isReviewer = username == 'reviewer';
    final user = AppUser(
      id: isDirector
          ? 'u-director'
          : isLead
              ? 'u-lead'
              : isReviewer
                  ? 'u-reviewer'
                  : 'u-staff',
      name: isDirector
          ? 'ประธานโครงการ'
          : isLead
              ? 'หัวหน้าฝ่ายกีฬา'
              : 'เจ้าหน้าที่กีฬา',
      username: username,
      role: isDirector
          ? 'Project Director'
          : isLead
              ? 'Committee Lead'
              : isReviewer
                  ? 'Evidence Reviewer'
                  : 'Task Owner',
    );
    const committee = Committee(id: 'c1', name: 'กีฬาและการแข่งขัน');
    _dashboardData = DashboardData(
      user: user,
      project: const ProjectInfo(
        id: 'p1',
        name: 'กีฬา 329 ชาวจีนยูนาน',
        edition: '2570',
      ),
      committees: const [committee],
      myKpi: const MyKpi(
        subtasksTotal: 12,
        subtasksPending: 4,
        subtasksDelayed: 1,
        evidencePending: 2,
        evidenceRejected: 0,
        committeeProgress: 67,
      ),
      projectKpi: const ProjectKpi(
        overall: 34,
        totalTasks: 43,
        delayedTasks: 3,
        evidencePending: 5,
        daysRemaining: 310,
        plannedBudget: 3660000,
        actualBudget: 0,
      ),
    );
    _tasks = [
      TaskItem(
        id: 't1',
        code: 'SP-001',
        title: 'จัดตารางการแข่งขัน',
        description: 'รวบรวมประเภทกีฬา สนาม และเวลาการแข่งขันให้พร้อมประกาศ',
        committee: committee,
        ownerId: user.id,
        dueDate: DateTime(2027, 3, 5),
        status: TaskStatus.inProgress,
        reportedProgress: 65,
        subtasks: [
          Subtask(
            id: 's1',
            title: 'ตรวจรายชื่อประเภทกีฬา',
            ownerId: user.id,
            status: TaskStatus.inProgress,
            reportedProgress: 70,
          ),
          const Subtask(
            id: 's2',
            title: 'ยืนยันสนามแข่งขัน',
            ownerId: 'u-lead',
            status: TaskStatus.submitted,
            reportedProgress: 60,
          ),
        ],
        evidence: [
          Evidence(
            id: 'ev1',
            caption: 'ไฟล์ร่างตารางการแข่งขัน',
            status: EvidenceStatus.pending,
            createdAt: DateTime(2026, 5, 24, 10, 30),
          ),
        ],
        comments: [
          TaskComment(
            id: 'c1',
            authorName: 'หัวหน้าฝ่ายกีฬา',
            message: 'กรุณาแนบไฟล์ตารางเวอร์ชันล่าสุดก่อนส่งตรวจ',
            createdAt: DateTime(2026, 5, 24, 13, 20),
          ),
        ],
      ),
      TaskItem(
        id: 't2',
        code: 'SP-002',
        title: 'เตรียมอุปกรณ์กีฬา',
        description: 'ตรวจนับอุปกรณ์ที่ต้องใช้ในวันจัดงาน',
        committee: committee,
        ownerId: user.id,
        dueDate: DateTime(2027, 2, 15),
        status: TaskStatus.delayed,
        reportedProgress: 30,
        subtasks: [
          Subtask(
            id: 's3',
            title: 'ทำรายการอุปกรณ์ที่ขาด',
            ownerId: user.id,
            status: TaskStatus.delayed,
            reportedProgress: 30,
          ),
        ],
        evidence: const [],
        comments: const [],
      ),
      TaskItem(
        id: 't3',
        code: 'SP-003',
        title: 'ประสานกรรมการตัดสิน',
        description: 'ติดต่อและยืนยันรายชื่อกรรมการตัดสินแต่ละประเภทกีฬา',
        committee: committee,
        ownerId: 'u-lead',
        dueDate: DateTime(2027, 3, 20),
        status: TaskStatus.notStarted,
        reportedProgress: 0,
        subtasks: const [
          Subtask(
            id: 's4',
            title: 'ส่งหนังสือเชิญกรรมการ',
            ownerId: 'u-lead',
            status: TaskStatus.notStarted,
            reportedProgress: 0,
          ),
        ],
        evidence: const [],
        comments: const [],
      ),
    ];
    _notifications = [
      AppNotification(
        id: 'n1',
        title: 'งานล่าช้า',
        body: 'เตรียมอุปกรณ์กีฬาเลยกำหนดแล้ว กรุณาอัปเดตความคืบหน้า',
        createdAt: DateTime(2026, 5, 26, 8, 30),
        read: false,
        taskId: 't2',
      ),
      AppNotification(
        id: 'n2',
        title: 'หลักฐานรอตรวจ',
        body: 'ไฟล์ร่างตารางการแข่งขันถูกส่งให้ผู้ตรวจสอบแล้ว',
        createdAt: DateTime(2026, 5, 24, 11),
        read: true,
        taskId: 't1',
      ),
    ];
  }
}
