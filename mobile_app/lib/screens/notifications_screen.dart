import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/thai_date.dart';
import '../providers/app_state.dart';
import '../widgets/empty_state.dart';
import '../widgets/loading_skeleton.dart';
import 'task_detail_screen.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (state.isBusy && state.notifications.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('แจ้งเตือน')),
        body: const LoadingSkeleton(),
      );
    }
    final items = [...state.notifications]
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return Scaffold(
      appBar: AppBar(
        title: const Text('แจ้งเตือน'),
        actions: [
          IconButton(
              onPressed: state.refreshAll,
              icon: const Icon(Icons.refresh),
              tooltip: 'รีเฟรช'),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: state.refreshAll,
        child: items.isEmpty
            ? const EmptyState(
                title: 'ไม่มีแจ้งเตือน',
                message: 'เมื่อมีรายการใหม่จะแสดงที่หน้านี้')
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Card(
                    child: ListTile(
                      leading: Icon(item.read
                          ? Icons.notifications_none
                          : Icons.notifications_active),
                      title: Text(item.title,
                          style: const TextStyle(fontWeight: FontWeight.w900)),
                      subtitle: Text(
                          '${item.body}\n${formatThaiDateTime(item.createdAt)}'),
                      isThreeLine: true,
                      trailing: item.read ? null : const Text('ใหม่'),
                      onTap: () async {
                        await context
                            .read<AppState>()
                            .markNotificationRead(item);
                        if (!context.mounted) return;
                        final task =
                            context.read<AppState>().taskById(item.taskId);
                        if (task != null) {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) =>
                                    TaskDetailScreen(taskId: task.id)),
                          );
                        }
                      },
                    ),
                  );
                },
              ),
      ),
    );
  }
}
