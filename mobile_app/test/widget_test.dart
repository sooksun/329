import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:mis_329_mobile/widgets/splash_screen.dart';

void main() {
  testWidgets('แสดง splash screen ระหว่างเริ่มต้น', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));

    expect(find.text('329 MIS'), findsOneWidget);
    expect(find.text('ระบบภาคสนามคณะกรรมการ'), findsOneWidget);
  });
}
