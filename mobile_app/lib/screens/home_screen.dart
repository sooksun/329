import 'package:flutter/material.dart';

import 'my_work_screen.dart';
import 'notifications_screen.dart';
import 'overview_screen.dart';
import 'profile_screen.dart';
import 'upload_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _index = 0;

  final _screens = const [
    OverviewScreen(),
    MyWorkScreen(),
    UploadScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.dashboard_outlined), label: 'ภาพรวม'),
          NavigationDestination(icon: Icon(Icons.task_alt), label: 'งานของฉัน'),
          NavigationDestination(
              icon: Icon(Icons.add_a_photo_outlined), label: 'อัปโหลด'),
          NavigationDestination(
              icon: Icon(Icons.notifications_outlined), label: 'แจ้งเตือน'),
          NavigationDestination(
              icon: Icon(Icons.person_outline), label: 'โปรไฟล์'),
        ],
      ),
    );
  }
}
