import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/api.dart';

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});
  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  final fromCtrl = TextEditingController();
  final toCtrl = TextEditingController();
  String groupBy = 'metallic';
  List<Map<String, dynamic>> rows = [];

  Future<void> _run() async {
    final res = await ApiClient.instance.dio.get('/reports/summary', queryParameters: {
      if (fromCtrl.text.isNotEmpty) 'from': fromCtrl.text,
      if (toCtrl.text.isNotEmpty) 'to': toCtrl.text,
      'groupBy': groupBy,
    });
    setState(() { rows = (res.data as List).cast<Map<String, dynamic>>(); });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Reports', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(spacing: 12, runSpacing: 12, children: [
                _datePicker('From', fromCtrl),
                _datePicker('To', toCtrl),
                SizedBox(
                  width: 220,
                  child: DropdownButtonFormField<String>(
                    value: groupBy,
                    items: const [DropdownMenuItem(value: 'metallic', child: Text('Metallic')), DropdownMenuItem(value: 'cut', child: Text('Cut'))],
                    onChanged: (v) => setState(() => groupBy = v ?? 'metallic'),
                    decoration: const InputDecoration(labelText: 'Group By', border: OutlineInputBorder()),
                  ),
                ),
                FilledButton(onPressed: _run, child: const Text('Run')),
              ]),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: SingleChildScrollView(
                  child: DataTable(columns: const [
                    DataColumn(label: Text('Group')),
                    DataColumn(label: Text('BobQty')),
                    DataColumn(label: Text('Gross'), numeric: true),
                    DataColumn(label: Text('Tare'), numeric: true),
                    DataColumn(label: Text('Net'), numeric: true),
                  ], rows: rows.map((r) => DataRow(cells: [
                    DataCell(Text(r['group_name'] ?? '')),
                    DataCell(Text('${r['total_bob_qty']}')),
                    DataCell(Text(((r['total_gross'] ?? 0) as num).toDouble().toStringAsFixed(3))),
                    DataCell(Text(((r['total_tare'] ?? 0) as num).toDouble().toStringAsFixed(3))),
                    DataCell(Text(((r['total_net'] ?? 0) as num).toDouble().toStringAsFixed(3))),
                  ])).toList()),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _datePicker(String label, TextEditingController ctrl) {
    return SizedBox(
      width: 240,
      child: TextFormField(
        controller: ctrl,
        readOnly: true,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
        onTap: () async {
          final init = DateTime.tryParse(ctrl.text) ?? DateTime.now();
          final picked = await showDatePicker(context: context, firstDate: DateTime(2020), lastDate: DateTime(2100), initialDate: init);
          if (picked != null) ctrl.text = DateFormat('yyyy-MM-dd').format(picked);
        },
      ),
    );
  }
}


