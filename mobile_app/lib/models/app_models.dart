enum TaskStatus {
  notStarted,
  inProgress,
  submitted,
  revisionRequired,
  verified,
  done,
  delayed,
}

enum EvidenceStatus { pending, approved, rejected }

class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.username,
    required this.role,
  });

  final String id;
  final String name;
  final String username;
  final String role;
}

class Committee {
  const Committee({required this.id, required this.name});
  final String id;
  final String name;
}

class ProjectInfo {
  const ProjectInfo({
    required this.id,
    required this.name,
    required this.edition,
  });

  final String id;
  final String name;
  final String edition;
}

class AuthSession {
  const AuthSession({
    required this.token,
    required this.user,
    required this.projectId,
    required this.committees,
  });

  final String token;
  final AppUser user;
  final String projectId;
  final List<Committee> committees;
}

class MyKpi {
  const MyKpi({
    required this.subtasksTotal,
    required this.subtasksPending,
    required this.subtasksDelayed,
    required this.evidencePending,
    required this.evidenceRejected,
    required this.committeeProgress,
  });

  final int subtasksTotal;
  final int subtasksPending;
  final int subtasksDelayed;
  final int evidencePending;
  final int evidenceRejected;
  final int committeeProgress;
}

class ProjectKpi {
  const ProjectKpi({
    required this.overall,
    required this.totalTasks,
    required this.delayedTasks,
    required this.evidencePending,
    required this.daysRemaining,
    required this.plannedBudget,
    required this.actualBudget,
  });

  final int overall;
  final int totalTasks;
  final int delayedTasks;
  final int evidencePending;
  final int daysRemaining;
  final num plannedBudget;
  final num actualBudget;
}

class DashboardData {
  const DashboardData({
    required this.user,
    required this.project,
    required this.committees,
    required this.myKpi,
    required this.projectKpi,
  });

  final AppUser user;
  final ProjectInfo project;
  final List<Committee> committees;
  final MyKpi myKpi;
  final ProjectKpi projectKpi;
}

class Subtask {
  const Subtask({
    required this.id,
    required this.title,
    required this.ownerId,
    required this.status,
    required this.reportedProgress,
  });

  final String id;
  final String title;
  final String? ownerId;
  final TaskStatus status;
  final int reportedProgress;

  Subtask copyWith({TaskStatus? status, int? reportedProgress}) {
    return Subtask(
      id: id,
      title: title,
      ownerId: ownerId,
      status: status ?? this.status,
      reportedProgress: reportedProgress ?? this.reportedProgress,
    );
  }
}

class Evidence {
  const Evidence({
    required this.id,
    required this.caption,
    required this.status,
    required this.createdAt,
    this.reviewerName,
    this.rejectionReason,
  });

  final String id;
  final String caption;
  final EvidenceStatus status;
  final DateTime createdAt;
  final String? reviewerName;
  final String? rejectionReason;

  Evidence copyWith({
    EvidenceStatus? status,
    String? reviewerName,
    String? rejectionReason,
    bool clearRejectionReason = false,
  }) {
    return Evidence(
      id: id,
      caption: caption,
      status: status ?? this.status,
      createdAt: createdAt,
      reviewerName: reviewerName ?? this.reviewerName,
      rejectionReason:
          clearRejectionReason ? null : rejectionReason ?? this.rejectionReason,
    );
  }
}

class TaskComment {
  const TaskComment({
    required this.id,
    required this.authorName,
    required this.message,
    required this.createdAt,
  });

  final String id;
  final String authorName;
  final String message;
  final DateTime createdAt;
}

class TaskItem {
  const TaskItem({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    required this.committee,
    required this.ownerId,
    required this.dueDate,
    required this.status,
    required this.reportedProgress,
    required this.subtasks,
    required this.evidence,
    required this.comments,
  });

  final String id;
  final String code;
  final String title;
  final String description;
  final Committee committee;
  final String? ownerId;
  final DateTime dueDate;
  final TaskStatus status;
  final int reportedProgress;
  final List<Subtask> subtasks;
  final List<Evidence> evidence;
  final List<TaskComment> comments;

  bool get isDelayed =>
      status == TaskStatus.delayed || dueDate.isBefore(DateTime.now());

  TaskItem copyWith({
    int? reportedProgress,
    TaskStatus? status,
    List<Subtask>? subtasks,
    List<Evidence>? evidence,
    List<TaskComment>? comments,
  }) {
    return TaskItem(
      id: id,
      code: code,
      title: title,
      description: description,
      committee: committee,
      ownerId: ownerId,
      dueDate: dueDate,
      status: status ?? this.status,
      reportedProgress: reportedProgress ?? this.reportedProgress,
      subtasks: subtasks ?? this.subtasks,
      evidence: evidence ?? this.evidence,
      comments: comments ?? this.comments,
    );
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.read,
    this.taskId,
  });

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;
  final String? taskId;

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      createdAt: createdAt,
      read: read ?? this.read,
      taskId: taskId,
    );
  }
}

String statusText(TaskStatus status) {
  switch (status) {
    case TaskStatus.notStarted:
      return 'ยังไม่เริ่ม';
    case TaskStatus.inProgress:
      return 'กำลังดำเนินการ';
    case TaskStatus.submitted:
      return 'ส่งตรวจ';
    case TaskStatus.revisionRequired:
      return 'ต้องแก้ไข';
    case TaskStatus.verified:
      return 'ตรวจแล้ว';
    case TaskStatus.done:
      return 'เสร็จสิ้น';
    case TaskStatus.delayed:
      return 'ล่าช้า';
  }
}

String evidenceStatusText(EvidenceStatus status) {
  switch (status) {
    case EvidenceStatus.pending:
      return 'รอตรวจ';
    case EvidenceStatus.approved:
      return 'อนุมัติ';
    case EvidenceStatus.rejected:
      return 'ไม่ผ่าน';
  }
}
