import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/app_models.dart';
import '../providers/app_state.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({
    super.key,
    this.initialTaskId,
    this.showScaffold = false,
  });

  final String? initialTaskId;
  final bool showScaffold;

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  static const _storage = FlutterSecureStorage();

  String? _taskId;
  String? _subtaskId;
  File? _file;
  final _caption = TextEditingController();
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _taskId = widget.initialTaskId;
    _caption.addListener(_saveDraft);
    _loadDraft();
  }

  @override
  void dispose() {
    _caption.removeListener(_saveDraft);
    _caption.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final body = _content(context);
    return Scaffold(
      appBar: AppBar(
          title: Text(widget.showScaffold ? 'อัปโหลดหลักฐาน' : 'อัปโหลด')),
      body: body,
    );
  }

  Widget _content(BuildContext context) {
    final state = context.watch<AppState>();
    final tasks = state.tasks;
    final selectedTask = _taskId == null ? null : state.taskById(_taskId);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        DropdownButtonFormField<String>(
          value: _taskId,
          decoration: const InputDecoration(labelText: 'เลือกภารกิจ'),
          items: tasks
              .map((task) => DropdownMenuItem(
                  value: task.id, child: Text('${task.code} ${task.title}')))
              .toList(),
          onChanged: (value) => setState(() {
            _taskId = value;
            _subtaskId = null;
            _caption.clear();
            _loadDraft();
          }),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _subtaskId,
          decoration: const InputDecoration(labelText: 'เลือกงานย่อย (ถ้ามี)'),
          items: (selectedTask?.subtasks ?? const <Subtask>[])
              .map((subtask) => DropdownMenuItem(
                  value: subtask.id, child: Text(subtask.title)))
              .toList(),
          onChanged: (value) => setState(() => _subtaskId = value),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _caption,
          minLines: 3,
          maxLines: 5,
          decoration:
              const InputDecoration(labelText: 'คำบรรยายหลักฐาน (บังคับ)'),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _pick(ImageSource.camera),
                icon: const Icon(Icons.photo_camera),
                label: const Text('ถ่ายรูป'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _pick(ImageSource.gallery),
                icon: const Icon(Icons.photo_library),
                label: const Text('เลือกจากเครื่อง'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: _pickDocument,
          icon: const Icon(Icons.attach_file),
          label: const Text('เลือกไฟล์ PDF'),
        ),
        const SizedBox(height: 12),
        if (_file != null) _Preview(file: _file!),
        const SizedBox(height: 18),
        FilledButton.icon(
          onPressed: state.isBusy ? null : _submit,
          icon: const Icon(Icons.cloud_upload),
          label: const Text('ส่งหลักฐาน'),
        ),
      ],
    );
  }

  Future<void> _pick(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;
    setState(() => _file = File(picked.path));
  }

  Future<void> _pickDocument() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    final path = picked?.files.single.path;
    if (path == null) return;
    setState(() => _file = File(path));
  }

  Future<void> _submit() async {
    if (_taskId == null) {
      _toast('กรุณาเลือกภารกิจ');
      return;
    }
    if (_caption.text.trim().isEmpty) {
      _toast('กรุณากรอกคำบรรยายหลักฐาน');
      return;
    }
    if (_file == null) {
      _toast('กรุณาเลือกไฟล์หลักฐาน');
      return;
    }
    try {
      await context.read<AppState>().uploadEvidence(
            taskId: _taskId!,
            subtaskId: _subtaskId,
            caption: _caption.text,
            file: _file!,
          );
      if (!mounted) return;
      _caption.clear();
      await _clearDraft();
      setState(() => _file = null);
      _toast('ส่งหลักฐานสำเร็จ');
    } catch (_) {
      if (!mounted) return;
      _toast(context.read<AppState>().errorMessage ?? 'ส่งหลักฐานไม่สำเร็จ');
    }
  }

  void _toast(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  String get _draftKey => 'upload_caption_draft_${_taskId ?? 'default'}';

  Future<void> _loadDraft() async {
    final value = await _storage.read(key: _draftKey);
    if (!mounted || value == null || _caption.text.isNotEmpty) return;
    _caption.text = value;
  }

  Future<void> _saveDraft() async {
    if (_caption.text.trim().isEmpty) return;
    await _storage.write(key: _draftKey, value: _caption.text);
  }

  Future<void> _clearDraft() async {
    await _storage.delete(key: _draftKey);
  }
}

class _Preview extends StatelessWidget {
  const _Preview({required this.file});

  final File file;

  @override
  Widget build(BuildContext context) {
    final isPdf = file.path.toLowerCase().endsWith('.pdf');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: isPdf
            ? Row(
                children: [
                  const Icon(Icons.picture_as_pdf),
                  const SizedBox(width: 8),
                  Expanded(
                      child:
                          Text(file.path.split(Platform.pathSeparator).last)),
                ],
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.file(file,
                    height: 220, width: double.infinity, fit: BoxFit.cover),
              ),
      ),
    );
  }
}
