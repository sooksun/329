import 'dart:io';

import '../models/app_models.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

abstract class MobileApi {
  Future<AuthSession> login(String username, String password);
  Future<DashboardData> dashboard(String token);
  Future<List<TaskItem>> myTasks(String token);
  Future<Subtask> updateSubtask({
    required String token,
    required String subtaskId,
    required TaskStatus status,
    required int reportedProgress,
  });
  Future<Evidence> uploadEvidence({
    required String token,
    required String taskId,
    String? subtaskId,
    required String caption,
    required File file,
  });
  Future<List<TaskComment>> taskComments(String token, String taskId);
  Future<TaskComment> addTaskComment({
    required String token,
    required String taskId,
    required String message,
  });
  Future<TaskItem> updateTaskStatus({
    required String token,
    required String taskId,
    required TaskStatus status,
  });
  Future<Evidence> reviewEvidence({
    required String token,
    required String evidenceId,
    required bool approved,
    String? rejectionReason,
  });
  Future<List<AppNotification>> notifications(String token);
  Future<void> markNotificationRead(String token, String notificationId);
  Future<AppUser> updateProfile({
    required String token,
    required String name,
    required String username,
    String? currentPassword,
    String? password,
  });
}
