import 'package:flutter/material.dart';

import '../models/app_models.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});

  final TaskStatus status;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (status) {
      TaskStatus.delayed => (const Color(0xFFFFE8EA), const Color(0xFFB91528)),
      TaskStatus.done || TaskStatus.verified => (
          const Color(0xFFE6F4EA),
          const Color(0xFF176C35)
        ),
      TaskStatus.submitted => (
          const Color(0xFFFFF3D6),
          const Color(0xFF8A5A00)
        ),
      _ => (const Color(0xFFE8F0FC), const Color(0xFF123F76)),
    };
    return DecoratedBox(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          statusText(status),
          style: TextStyle(color: foreground, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}
