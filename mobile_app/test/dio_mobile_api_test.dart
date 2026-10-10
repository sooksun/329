import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mis_329_mobile/models/app_models.dart';
import 'package:mis_329_mobile/services/dio_mobile_api.dart';
import 'package:mis_329_mobile/services/mobile_api.dart';

/// ตอบทุก request ด้วย status/body ที่กำหนด — ใช้ทดสอบการ parse โดยไม่ต้องมี server
class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.status, this.body, {this.headers = const {}});

  final int status;
  final Object body;
  final Map<String, List<String>> headers;

  @override
  Future<ResponseBody> fetch(RequestOptions options,
      Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    return ResponseBody.fromString(
      body is String ? body as String : jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
        ...headers,
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

DioMobileApi _api(int status, Object body,
    {Map<String, List<String>> headers = const {}}) {
  final dio =
      Dio(BaseOptions(baseUrl: 'http://test', validateStatus: (_) => true));
  dio.httpClientAdapter = _FakeAdapter(status, body, headers: headers);
  return DioMobileApi(dio: dio);
}

void main() {
  test('parses tasks from export payload using database ids', () async {
    final api = _api(200, {
      'project': {'id': 'p1', 'name': 'P', 'edition': '2570'},
      'committees': [
        {'id': 'c1', 'name': 'กีฬา'}
      ],
      'tasks': [
        {
          'id': 'task-db-id',
          'code': 'T-001',
          'title': 'เตรียมสนาม',
          'description': '',
          'committee': {'id': 'c1', 'name': 'กีฬา'},
          'owner_id': 'u1',
          'due_date': '2027-03-01T00:00:00.000Z',
          'status': 'IN_PROGRESS',
          'reported_progress': 40,
          'subtasks': [
            {
              'id': 's1',
              'title': 'ตัดหญ้า',
              'owner_id': 'u2',
              'status': 'DONE',
              'reported_progress': 100
            }
          ],
          'evidence': [
            {
              'id': 'e1',
              'caption': 'ภาพ',
              'status': 'REJECTED',
              'created_at': '2027-02-01T00:00:00.000Z',
              'reviewed_by': 'u3',
              'rejection_reason': 'ไม่ชัด'
            }
          ],
          'comments': []
        }
      ],
      'rows': []
    });

    final tasks = await api.myTasks('cookie');

    expect(tasks, hasLength(1));
    final task = tasks.single;
    expect(task.id, 'task-db-id');
    expect(task.ownerId, 'u1');
    expect(task.status, TaskStatus.inProgress);
    expect(task.subtasks.single.ownerId, 'u2');
    expect(task.evidence.single.reviewerName, 'u3');
    expect(task.evidence.single.rejectionReason, 'ไม่ชัด');
  });

  test('treats a redirect to the login page as an expired session', () async {
    final api = _api(307, '', headers: {
      'location': ['http://test/login']
    });

    await expectLater(
      api.myTasks('expired'),
      throwsA(
          isA<ApiException>().having((e) => e.statusCode, 'statusCode', 401)),
    );
  });
}
