import 'package:flutter/material.dart';

const navy = Color(0xFF123F76);
const gold = Color(0xFFB68A2E);
const cream = Color(0xFFFBFAF5);
const danger = Color(0xFFB91528);

ThemeData buildAppTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: navy,
    primary: navy,
    secondary: gold,
    error: danger,
    surface: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: cream,
    fontFamily: 'Sarabun',
    appBarTheme: const AppBarTheme(
      backgroundColor: cream,
      foregroundColor: navy,
      centerTitle: false,
      elevation: 0,
      titleTextStyle: TextStyle(
        color: navy,
        fontSize: 22,
        fontWeight: FontWeight.w800,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        backgroundColor: navy,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: navy, width: 2),
      ),
    ),
    cardTheme: CardTheme(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
