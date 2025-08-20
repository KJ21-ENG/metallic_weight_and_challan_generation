import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/api.dart';
import '../utils/parsing.dart';
import 'package:url_launcher/url_launcher_string.dart';

class ManagementPage extends StatefulWidget {
  const ManagementPage({super.key});
  @override
  State<ManagementPage> createState() => _ManagementPageState();
}

class _ManagementPageState extends State<ManagementPage> {
  List<Map<String, dynamic>> rows = [];
  final fromCtrl = TextEditingController();
  final toCtrl = TextEditingController();

  Map<String, dynamic>? editing; // { id, challan_no, date, customer_id, shift_id }
  List<Map<String, dynamic>> items = [];

  List<Map<String, dynamic>> customers = [];
  List<Map<String, dynamic>> shifts = [];
  List<Map<String, dynamic>> metallics = [];
  List<Map<String, dynamic>> cuts = [];
  List<Map<String, dynamic>> employees = [];
  List<Map<String, dynamic>> bobTypes = [];
  List<Map<String, dynamic>> boxTypes = [];

  Map<String, dynamic>? deleteRow;
  final deleteReasonCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiClient.instance.dio.get('/challans');
    setState(() { rows = (res.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(); });
  }

  Future<void> _search() async {
    final res = await ApiClient.instance.dio.get('/challans', queryParameters: {
      if (fromCtrl.text.isNotEmpty) 'from': fromCtrl.text,
      if (toCtrl.text.isNotEmpty) 'to': toCtrl.text,
    });
    setState(() { rows = (res.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(); });
  }

  void _openPdf(Map<String, dynamic> row) {
    if (row['id'] != null) {
      final url = 'http://localhost:4000/api/challans/${row['id']}/print';
      launchUrlString(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _startEdit(Map<String, dynamic> row) async {
    final res = await ApiClient.instance.dio.get('/challans/${row['id']}');
    final data = Map<String, dynamic>.from(res.data as Map);
    final challan = Map<String, dynamic>.from(data['challan'] as Map);
    final its = (data['items'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    setState(() {
      editing = {
        'id': asInt(challan['id']),
        'challan_no': asInt(challan['challan_no']),
        'date': asString(challan['date']),
        'customer_id': asInt(challan['customer_id']),
        'shift_id': asInt(challan['shift_id']),
      };
      items = its.map((e) => {
        'metallic_id': asInt(e['metallic_id']),
        'cut_id': asInt(e['cut_id']),
        'operator_id': asInt(e['operator_id']),
        'helper_id': e['helper_id'] == null ? null : asInt(e['helper_id']),
        'bob_type_id': asInt(e['bob_type_id']),
        'box_type_id': asInt(e['box_type_id']),
        'bob_qty': asInt(e['bob_qty']),
        'gross_wt': asDouble(e['gross_wt']),
      }).toList();
    });

    if (customers.isEmpty) customers = (await getOptions('customers')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (shifts.isEmpty) shifts = (await getOptions('shifts')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (metallics.isEmpty) metallics = (await getOptions('metallics')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (cuts.isEmpty) cuts = (await getOptions('cuts')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (employees.isEmpty) employees = (await getOptions('employees')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (bobTypes.isEmpty) bobTypes = (await getOptions('bob_types')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (boxTypes.isEmpty) boxTypes = (await getOptions('box_types')).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  void _addRow() {
    setState(() {
      items.add({
        'metallic_id': 0,
        'cut_id': 0,
        'operator_id': 0,
        'helper_id': null,
        'bob_type_id': 0,
        'box_type_id': 0,
        'bob_qty': 0,
        'gross_wt': 0.0,
      });
    });
  }

  void _removeRow(int i) { setState(() => items.removeAt(i)); }

  Future<void> _saveEdit() async {
    if (editing == null) return;
    final payload = {
      'date': editing!['date'],
      'customer_id': editing!['customer_id'],
      'shift_id': editing!['shift_id'],
      'items': items,
    };
    final id = editing!['id'];
    await ApiClient.instance.dio.put('/challans/$id', data: payload);
    setState(() { editing = null; items = []; });
    await _load();
  }

  Future<void> _softDelete() async {
    if (deleteRow == null) return;
    await ApiClient.instance.dio.delete('/challans/${deleteRow!['id']}', queryParameters: {
      if (deleteReasonCtrl.text.isNotEmpty) 'reason': deleteReasonCtrl.text,
    });
    setState(() { deleteRow = null; });
    await _load();
  }

  // String _nameOf(List<Map<String, dynamic>> opts, int id) {
  //   final it = opts.cast<Map<String, dynamic>>().where((e) => (e['id'] as num).toInt() == id).cast<Map<String, dynamic>>().firstOrNull;
  //   return (it == null) ? '' : (it['name'] ?? '').toString();
  // }

  double _weightOf(List<Map<String, dynamic>> opts, int id) {
    final it = opts.where((e) => asInt(e['id']) == id).firstOrNull;
    return it == null ? 0.0 : asDouble(it['weight_kg']);
  }

  @override
  Widget build(BuildContext context) {
    if (editing != null) {
      return _editView(context);
    }
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Challans', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(spacing: 12, runSpacing: 12, children: [
                _datePicker('From', fromCtrl),
                _datePicker('To', toCtrl),
                FilledButton(onPressed: _search, child: const Text('Search')),
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
                    DataColumn(label: Text('ID')),
                    DataColumn(label: Text('Challan No')),
                    DataColumn(label: Text('Date')),
                    DataColumn(label: Text('Customer')),
                    DataColumn(label: Text('Total Bobbin'), numeric: true),
                    DataColumn(label: Text('Total Net (kg)'), numeric: true),
                    DataColumn(label: Text('Actions'), numeric: true),
                  ], rows: rows.map((r) {
                    return DataRow(cells: [
                      DataCell(Text(asInt(r['id']).toString())),
                      DataCell(Text(asInt(r['challan_no']).toString().padLeft(6, '0'))),
                      DataCell(Text(DateFormat('dd/MM/yyyy').format(DateTime.parse(asString(r['date']))))),
                      DataCell(Text(asString(r['customer_name']))),
                      DataCell(Text(asInt(r['total_bob_qty']).toString())),
                      DataCell(Text(asDouble(r['total_net_wt'] ?? r['total_net'] ?? 0).toStringAsFixed(3))),
                      DataCell(Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                        TextButton(onPressed: () => _openPdf(r), child: const Text('Open PDF')),
                        const SizedBox(width: 8),
                        TextButton(onPressed: () => _startEdit(r), child: const Text('Edit')),
                        const SizedBox(width: 8),
                        OutlinedButton(onPressed: () => setState(() { deleteRow = r; deleteReasonCtrl.clear(); }), child: const Text('Delete')),
                      ])),
                    ]);
                  }).toList()),
                ),
              ),
            ),
          ),
          if (deleteRow != null) _deleteDialog(context),
        ],
      ),
    );
  }

  Widget _editView(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Edit Challan #${asInt(editing!['challan_no']).toString().padLeft(6, '0')}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(spacing: 12, runSpacing: 12, children: [
                _datePickerWithValue('Date', editing!['date'], (v) => setState(() => editing!['date'] = v)),
                _dropdown('Customer', asInt(editing!['customer_id']), customers, (v) => setState(() => editing!['customer_id'] = v)),
                _dropdown('Shift', asInt(editing!['shift_id']), shifts, (v) => setState(() => editing!['shift_id'] = v)),
              ]),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextButton(onPressed: _addRow, child: const Text('+ Add Item')),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(columns: const [
                      DataColumn(label: Text('#')),
                      DataColumn(label: Text('Metallic')),
                      DataColumn(label: Text('Cut')),
                      DataColumn(label: Text('Operator')),
                      DataColumn(label: Text('Helper')),
                      DataColumn(label: Text('Bob')),
                      DataColumn(label: Text('Box')),
                      DataColumn(label: Text('Qty'), numeric: true),
                      DataColumn(label: Text('Gross'), numeric: true),
                      DataColumn(label: Text('Tare'), numeric: true),
                      DataColumn(label: Text('Net'), numeric: true),
                      DataColumn(label: Text('')),
                    ], rows: items.asMap().entries.map((e) {
                      final i = e.key; final it = e.value;
                      final bw = _weightOf(bobTypes, asInt(it['bob_type_id']));
                      final bxw = _weightOf(boxTypes, asInt(it['box_type_id']));
                      final tare = (asInt(it['bob_qty']) * bw + bxw);
                      final net = (asDouble(it['gross_wt']) - tare);
                      return DataRow(cells: [
                        DataCell(Text('${i + 1}')),
                        DataCell(_dropdownCell(metallics, asInt(it['metallic_id']), (v) => setState(() => items[i]['metallic_id'] = v))),
                        DataCell(_dropdownCell(cuts, asInt(it['cut_id']), (v) => setState(() => items[i]['cut_id'] = v))),
                        DataCell(_dropdownCell(employees.where((e) => e['role_operator'] == true).toList(), asInt(it['operator_id']), (v) => setState(() => items[i]['operator_id'] = v))),
                        DataCell(_dropdownCell([{ 'id': 0, 'name': 'None' }, ...employees.where((e) => e['role_helper'] == true)], asInt(it['helper_id']), (v) => setState(() => items[i]['helper_id'] = v))),
                        DataCell(_dropdownCell(bobTypes, asInt(it['bob_type_id']), (v) => setState(() => items[i]['bob_type_id'] = v))),
                        DataCell(_dropdownCell(boxTypes, asInt(it['box_type_id']), (v) => setState(() => items[i]['box_type_id'] = v))),
                        DataCell(SizedBox(width: 120, child: TextField(controller: TextEditingController(text: asInt(it['bob_qty']).toString()), onChanged: (v) => items[i]['bob_qty'] = int.tryParse(v) ?? 0, textAlign: TextAlign.right))),
                        DataCell(SizedBox(width: 160, child: TextField(controller: TextEditingController(text: asDouble(it['gross_wt']).toString()), onChanged: (v) => items[i]['gross_wt'] = double.tryParse(v) ?? 0.0, textAlign: TextAlign.right))),
                        DataCell(Text(tare.toStringAsFixed(3))),
                        DataCell(Text(net.toStringAsFixed(3))),
                        DataCell(OutlinedButton(onPressed: () => _removeRow(i), child: const Text('Remove'))),
                      ]);
                    }).toList()),
                  ),
                  Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                    TextButton(onPressed: _saveEdit, child: const Text('Save Changes')),
                    const SizedBox(width: 8),
                    OutlinedButton(onPressed: () => setState(() { editing = null; items = []; }), child: const Text('Cancel')),
                  ])
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _deleteDialog(BuildContext context) {
    return AlertDialog(
      title: Text('Delete Challan #${asInt(deleteRow!['challan_no']).toString().padLeft(6, '0')}'),
      content: TextField(controller: deleteReasonCtrl, decoration: const InputDecoration(labelText: 'Reason')), 
      actions: [
        OutlinedButton(onPressed: () => setState(() => deleteRow = null), child: const Text('Cancel')),
        FilledButton(onPressed: _softDelete, child: const Text('Delete')),
      ],
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

  Widget _datePickerWithValue(String label, String value, ValueChanged<String> onChanged) {
    final ctrl = TextEditingController(text: value);
    return SizedBox(
      width: 240,
      child: TextFormField(
        controller: ctrl,
        readOnly: true,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
        onTap: () async {
          final init = DateTime.tryParse(ctrl.text) ?? DateTime.now();
          final picked = await showDatePicker(context: context, firstDate: DateTime(2020), lastDate: DateTime(2100), initialDate: init);
          if (picked != null) onChanged(DateFormat('yyyy-MM-dd').format(picked));
        },
      ),
    );
  }

  Widget _dropdown(String label, int value, List<Map<String, dynamic>> opts, ValueChanged<int> onChanged) {
    return SizedBox(
      width: 260,
      child: DropdownButtonFormField<int>(
        value: value,
        items: opts.map((e) => DropdownMenuItem(value: asInt(e['id']), child: Text(asString(e['name'])))).toList(),
        onChanged: (v) { if (v != null) onChanged(v); },
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      ),
    );
  }

  Widget _dropdownCell(List<Map<String, dynamic>> opts, int? value, ValueChanged<int?> onChanged) {
    return SizedBox(
      width: 220,
      child: DropdownButtonFormField<int>(
        value: value,
        isDense: true,
        items: opts.map((e) => DropdownMenuItem<int>(value: (e['id'] == null) ? null : asInt(e['id']), child: Text(asString(e['name'])))).toList(),
        onChanged: onChanged,
      ),
    );
  }
}

extension FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}


