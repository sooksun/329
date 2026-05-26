import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/app_state.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/dio_mobile_api.dart';
import 'widgets/offline_banner.dart';
import 'widgets/splash_screen.dart';

class Mis329App extends StatelessWidget {
  const Mis329App({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(api: DioMobileApi())..restoreSession(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: '329 MIS',
        theme: buildAppTheme(),
        builder: (context, child) {
          final offline = context.watch<AppState>().isOffline;
          return Column(
            children: [
              OfflineBanner(visible: offline),
              Expanded(child: child ?? const SizedBox.shrink()),
            ],
          );
        },
        home: Consumer<AppState>(
          builder: (context, state, _) {
            if (state.isBooting) {
              return const SplashScreen();
            }
            return state.isAuthenticated
                ? const HomeScreen()
                : const LoginScreen();
          },
        ),
      ),
    );
  }
}
