import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../widgets/empty_state.dart';
import '../widgets/loading_skeleton.dart';
import '../widgets/task_card.dart';
import 'task_detail_screen.dart';

enum TaskFilter { all, owner, delayed }

class MyWorkScreen extends StatefulWidget {
  const MyWorkScreen({super.key});

  @override
  State<MyWorkScreen> createState() => _MyWorkScreenState();
}

class _MyWorkScreenState extends State<MyWorkScreen> {
  TaskFilter _filter = TaskFilter.all;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    if (state.isBusy && state.tasks.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('งานของฉัน')),
        body: const LoadingSkeleton(),
      );
    }
    final userId = state.session?.user.id;
    final tasks = state.tasks.where((task) {
      return switch (_filter) {
        TaskFilter.all => true,
        TaskFilter.owner => task.ownerId == userId ||
            task.subtasks.any((s) => s.ownerId == userId),
        TaskFilter.delayed => task.isDelayed,
      };
    }).toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('งานของฉัน'),
        actions: [
          IconButton(
              onPressed: state.refreshAll,
              icon: const Icon(Icons.refresh),
              tooltip: 'รีเฟรช'),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: state.refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SegmentedButton<TaskFilter>(
              segments: const [
                ButtonSegment(value: TaskFilter.all, label: Text('ทั้งหมด')),
                ButtonSegment(
                    value: TaskFilter.owner, label: Text('รับผิดชอบ')),
                ButtonSegment(value: TaskFilter.delayed, label: Text('ล่าช้า')),
              ],
              selected: {_filter},
              onSelectionChanged: (value) =>
                  setState(() => _filter = value.first),
            ),
            const SizedBox(height: 12),
            if (tasks.isEmpty)
              const SizedBox(
                height: 360,
                child: EmptyState(
                    title: 'ไม่มีงาน', message: 'ยังไม่มีรายการตามตัวกรองนี้'),
              )
            else
              ...tasks.map(
                (task) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: TaskCard(
                    task: task,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => TaskDetailScreen(taskId: task.id)),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
