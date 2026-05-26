import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _name = TextEditingController();
  final _username = TextEditingController();
  final _currentPassword = TextEditingController();
  final _password = TextEditingController();
  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final session = state.session;
    if (session == null) return const SizedBox.shrink();
    if (!_initialized) {
      _name.text = session.user.name;
      _username.text = session.user.username;
      _initialized = true;
    }
    return Scaffold(
      appBar: AppBar(title: const Text('โปรไฟล์')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(session.user.name,
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text('ชื่อผู้ใช้ ${session.user.username}'),
                  Text('บทบาท ${session.user.role}'),
                  Text(
                      'คณะ ${session.committees.map((c) => c.name).join(', ')}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'ชื่อ')),
          const SizedBox(height: 12),
          TextField(
              controller: _username,
              decoration: const InputDecoration(labelText: 'ชื่อผู้ใช้')),
          const SizedBox(height: 12),
          TextField(
            controller: _currentPassword,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'รหัสผ่านปัจจุบัน'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'รหัสผ่านใหม่'),
          ),
          const SizedBox(height: 18),
          FilledButton(
              onPressed: state.isBusy ? null : _save,
              child: const Text('บันทึกโปรไฟล์')),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: state.logout,
            icon: const Icon(Icons.logout),
            label: const Text('ออกจากระบบ'),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    try {
      await context.read<AppState>().updateProfile(
            name: _name.text,
            username: _username.text,
            currentPassword:
                _currentPassword.text.isEmpty ? null : _currentPassword.text,
            password: _password.text.isEmpty ? null : _password.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('บันทึกสำเร็จ')));
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
