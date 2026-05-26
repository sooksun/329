import 'package:flutter/material.dart';

import '../core/thai_date.dart';
import '../models/app_models.dart';
import 'status_badge.dart';

class TaskCard extends StatelessWidget {
  const TaskCard({
    super.key,
    required this.task,
    required this.onTap,
  });

  final TaskItem task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${task.code} · ${task.committee.name}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  StatusBadge(status: task.status),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                task.title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text('ครบกำหนด ${formatThaiDate(task.dueDate)}'),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  minHeight: 10,
                  value: task.reportedProgress / 100,
                ),
              ),
              const SizedBox(height: 6),
              Text('ความคืบหน้า ${task.reportedProgress}%'),
            ],
          ),
        ),
      ),
    );
  }
}
