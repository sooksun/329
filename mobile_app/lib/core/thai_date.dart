import 'package:intl/intl.dart';

final _shortDate = DateFormat('d MMM', 'th_TH');
final _time = DateFormat('HH:mm', 'th_TH');

String formatThaiDate(DateTime value) {
  return '${_shortDate.format(value)} ${value.year + 543}';
}

String formatThaiDateTime(DateTime value) {
  return '${formatThaiDate(value)} ${_time.format(value)}';
}

String formatBudgetMillion(num value) {
  return '฿${(value / 1000000).toStringAsFixed(1)} ล้าน';
}
