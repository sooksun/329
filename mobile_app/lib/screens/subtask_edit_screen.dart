import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/app_models.dart';
import '../providers/app_state.dart';

class SubtaskEditScreen extends StatefulWidget {
  const SubtaskEditScreen({super.key, required this.subtask});

  final Subtask subtask;

  @override
  State<SubtaskEditScreen> createState() => _SubtaskEditScreenState();
}

class _SubtaskEditScreenState extends State<SubtaskEditScreen> {
  late double _progress = widget.subtask.reportedProgress.toDouble();
  late TaskStatus _status = widget.subtask.status;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('แก้งานย่อย')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.subtask.title,
              style:
                  const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 18),
          Text('ความคืบหน้า ${_progress.round()}%',
              style: const TextStyle(fontWeight: FontWeight.w800)),
          Slider(
            value: _progress,
            min: 0,
            max: 100,
            divisions: 100,
            label: '${_progress.round()}%',
            onChanged: (value) => setState(() => _progress = value),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<TaskStatus>(
            value: _status,
            decoration: const InputDecoration(labelText: 'สถานะ'),
            items: TaskStatus.values
                .map((status) => DropdownMenuItem(
                    value: status, child: Text(statusText(status))))
                .toList(),
            onChanged: (value) {
              if (value != null) setState(() => _status = value);
            },
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: state.isBusy ? null : _save,
            child: state.isBusy
                ? const CircularProgressIndicator()
                : const Text('บันทึก'),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    try {
      await context
          .read<AppState>()
          .updateSubtask(widget.subtask, _status, _progress.round());
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('บันทึกสำเร็จ')));
      Navigator.of(context).pop();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                context.read<AppState>().errorMessage ?? 'บันทึกไม่สำเร็จ')),
      );
    }
  }
}
