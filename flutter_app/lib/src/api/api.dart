import 'package:dio/dio.dart';

class ApiClient {
  ApiClient._internal();
  static final ApiClient instance = ApiClient._internal();

  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'http://localhost:4000/api',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 30),
  ));

  Dio get dio => _dio;
}

Future<List<dynamic>> getOptions(String type) async {
  final res = await ApiClient.instance.dio.get('/master/$type');
  return res.data as List<dynamic>;
}


