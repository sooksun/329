import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/thai_date.dart';
import '../models/app_models.dart';
import '../providers/app_state.dart';
import '../widgets/status_badge.dart';
import 'subtask_edit_screen.dart';
import 'upload_screen.dart';

class TaskDetailScreen extends StatefulWidget {
  const TaskDetailScreen({super.key, required this.taskId});

  final String taskId;

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final _comment = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final task = state.taskById(widget.taskId);
    final userId = state.session?.user.id;
    if (task == null) {
      return const Scaffold(body: Center(child: Text('ไม่พบภารกิจ')));
    }
    return Scaffold(
      appBar: AppBar(title: Text(task.code)),
      body: RefreshIndicator(
        onRefresh: state.refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    task.title,
                    style: const TextStyle(
                        fontSize: 24, fontWeight: FontWeight.w900),
                  ),
                ),
                StatusBadge(status: task.status),
              ],
            ),
            const SizedBox(height: 8),
            Text(task.description),
            const SizedBox(height: 12),
            Text('คณะ ${task.committee.name}'),
            Text('ครบกำหนด ${formatThaiDate(task.dueDate)}'),
            const SizedBox(height: 12),
            LinearProgressIndicator(
                value: task.reportedProgress / 100, minHeight: 10),
            const SizedBox(height: 6),
            Text('ความคืบหน้า ${task.reportedProgress}%'),
            if (state.isCommitteeLead) ...[
              const SizedBox(height: 16),
              DropdownButtonFormField<TaskStatus>(
                value: task.status,
                decoration:
                    const InputDecoration(labelText: 'อัปเดตสถานะภารกิจ'),
                items: TaskStatus.values
                    .map((status) => DropdownMenuItem(
                        value: status, child: Text(statusText(status))))
                    .toList(),
                onChanged: state.isBusy
                    ? null
                    : (value) =>
                        value == null ? null : _updateTaskStatus(value),
              ),
            ],
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => UploadScreen(
                        initialTaskId: task.id, showScaffold: true)),
              ),
              icon: const Icon(Icons.upload_file),
              label: const Text('อัปโหลดหลักฐาน'),
            ),
            const SizedBox(height: 22),
            const Text('งานย่อย',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            ...task.subtasks.map(
              (subtask) {
                final canEdit = subtask.ownerId == userId;
                return Card(
                  child: ListTile(
                    title: Text(subtask.title,
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    subtitle: Text('ความคืบหน้า ${subtask.reportedProgress}%'),
                    trailing: canEdit
                        ? const Icon(Icons.edit)
                        : const Icon(Icons.lock_outline),
                    onTap: canEdit
                        ? () => Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) =>
                                      SubtaskEditScreen(subtask: subtask)),
                            )
                        : null,
                  ),
                );
              },
            ),
            const SizedBox(height: 18),
            const Text('หลักฐาน',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            if (task.evidence.isEmpty)
              const Text('ยังไม่มีหลักฐานที่อัปโหลด')
            else
              ...task.evidence.map((item) => _EvidenceTile(item: item)),
            const SizedBox(height: 18),
            const Text('ความคิดเห็น',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            TextField(
              controller: _comment,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'เขียนความคิดเห็น'),
            ),
            const SizedBox(height: 10),
            FilledButton.icon(
              onPressed: state.isBusy ? null : _sendComment,
              icon: const Icon(Icons.send),
              label: const Text('ส่งความคิดเห็น'),
            ),
            const SizedBox(height: 10),
            if (task.comments.isEmpty)
              const Text('ยังไม่มีความคิดเห็น')
            else
              ...task.comments.map(
                (comment) => Card(
                  child: ListTile(
                    title: Text(comment.authorName,
                        style: const TextStyle(fontWeight: FontWeight.w900)),
                    subtitle: Text(
                        '${comment.message}\n${formatThaiDateTime(comment.createdAt)}'),
                    isThreeLine: true,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendComment() async {
    try {
      await context
          .read<AppState>()
          .addTaskComment(widget.taskId, _comment.text);
      _comment.clear();
      if (!mounted) return;
      _toast('ส่งความคิดเห็นสำเร็จ');
    } catch (_) {
      if (!mounted) return;
      _toast(
          context.read<AppState>().errorMessage ?? 'ส่งความคิดเห็นไม่สำเร็จ');
    }
  }

  Future<void> _updateTaskStatus(TaskStatus status) async {
    try {
      await context.read<AppState>().updateTaskStatus(widget.taskId, status);
      if (!mounted) return;
      _toast('บันทึกสถานะสำเร็จ');
    } catch (_) {
      if (!mounted) return;
      _toast(context.read<AppState>().errorMessage ?? 'บันทึกสถานะไม่สำเร็จ');
    }
  }

  void _toast(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _EvidenceTile extends StatelessWidget {
  const _EvidenceTile({required this.item});

  final Evidence item;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final canReview =
        state.canReviewEvidence && item.status == EvidenceStatus.pending;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(item.caption),
              subtitle: Text(formatThaiDateTime(item.createdAt)),
              trailing: Text(
                evidenceStatusText(item.status),
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
            if (item.reviewerName != null) Text('ผู้ตรวจ ${item.reviewerName}'),
            if (item.rejectionReason != null)
              Text('เหตุผล: ${item.rejectionReason}'),
            if (canReview) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => _review(context, approved: true),
                      child: const Text('อนุมัติ'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _askRejectReason(context),
                      child: const Text('ปฏิเสธ'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _review(BuildContext context,
      {required bool approved, String? reason}) async {
    try {
      await context.read<AppState>().reviewEvidence(
            evidenceId: item.id,
            approved: approved,
            rejectionReason: reason,
          );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text(approved ? 'อนุมัติหลักฐานแล้ว' : 'ปฏิเสธหลักฐานแล้ว')),
      );
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(context.read<AppState>().errorMessage ??
                'บันทึกผลตรวจไม่สำเร็จ')),
      );
    }
  }

  Future<void> _askRejectReason(BuildContext context) async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('เหตุผลที่ปฏิเสธ'),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 5,
          decoration: const InputDecoration(labelText: 'กรอกเหตุผล'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('ยกเลิก')),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(controller.text),
              child: const Text('บันทึก')),
        ],
      ),
    );
    if (reason == null) return;
    if (!context.mounted) return;
    await _review(context, approved: false, reason: reason);
  }
}
