import 'package:flutter_dotenv/flutter_dotenv.dart';

/// URL ของ backend production — release build ต้องไม่ชี้ localhost
const productionApiBaseUrl = 'https://329.cnppai.com';

class AppConfig {
  /// ลำดับความสำคัญ: --dart-define=API_BASE_URL=... (ใช้ตอน dev เช่น http://10.0.2.2:3000)
  /// → ค่าใน .env → production
  static String get apiBaseUrl {
    const fromDefine = String.fromEnvironment('API_BASE_URL');
    if (fromDefine.isNotEmpty) return fromDefine;
    final fromEnv = dotenv.maybeGet('API_BASE_URL');
    if (fromEnv != null && fromEnv.isNotEmpty) return fromEnv;
    return productionApiBaseUrl;
  }
}
