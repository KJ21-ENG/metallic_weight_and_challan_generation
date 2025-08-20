import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:printing/printing.dart';
import '../api/api.dart';

class MasterPage extends StatefulWidget {
  const MasterPage({super.key});
  @override
  State<MasterPage> createState() => _MasterPageState();
}

class _MasterPageState extends State<MasterPage> {
  String type = 'metallics';
  List<Map<String, dynamic>> items = [];

  final nameCtrl = TextEditingController();
  final weightCtrl = TextEditingController();
  bool roleOp = false;
  bool roleHelp = false;
  final addressCtrl = TextEditingController();
  final gstinCtrl = TextEditingController();
  final mobileCtrl = TextEditingController();
  final emailCtrl = TextEditingController();

  int? editingId;
  Map<String, dynamic>? edit;

  // Printers
  String labelPrinter = '';
  String challanPrinter = '';
  List<String> availablePrinters = [];
  late TextEditingController labelPrinterCtrl;
  late TextEditingController challanPrinterCtrl;

  bool get isWeighted => type == 'bob_types' || type == 'box_types';
  bool get isEmployees => type == 'employees';
  bool get isCustomers => type == 'customers';
  bool get isFirms => type == 'firms';
  bool get isPrinterSettings => type == 'printer_settings';

  final tabs = const [
    ('metallics','Metallic'),
    ('cuts','Cut'),
    ('employees','Employees'),
    ('bob_types','Bob Type'),
    ('box_types','Box Type'),
    ('customers','Customers'),
    ('shifts','Shifts'),
    ('firms','Firm'),
    ('printer_settings','Printer Settings'),
  ];

  @override
  void initState() {
    super.initState();
    labelPrinterCtrl = TextEditingController();
    challanPrinterCtrl = TextEditingController();
    _load();
  }

  Future<void> _load() async {
    if (isPrinterSettings) {
      final prefs = await SharedPreferences.getInstance();
      // Load saved prefs first
      labelPrinter = prefs.getString('labelPrinter') ?? '';
      challanPrinter = prefs.getString('challanPrinter') ?? '';
      labelPrinterCtrl.text = labelPrinter;
      challanPrinterCtrl.text = challanPrinter;

      // Try to list system printers (may not be supported on all platforms)
      await _refreshPrinters();
    } else {
      final data = await getOptions(type);
      setState(() { items = data.cast<Map<String, dynamic>>(); });
    }
  }

  Future<void> _refreshPrinters() async {
    try {
      final printers = await Printing.listPrinters();
      final names = printers.map((p) => p.name).toList();
      if (!mounted) return;
      setState(() {
        availablePrinters = names;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Found ${names.length} printer(s)')));
    } catch (e) {
      if (!mounted) return;
      setState(() { availablePrinters = []; });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to list printers')));
    }
  }

  void _resetForm() {
    nameCtrl.clear(); weightCtrl.clear(); roleOp = false; roleHelp = false;
    addressCtrl.clear(); gstinCtrl.clear(); mobileCtrl.clear(); emailCtrl.clear();
    editingId = null; edit = null;
  }

  Future<void> _add() async {
    if (nameCtrl.text.trim().isEmpty) return;
    final body = <String, dynamic>{'name': nameCtrl.text.trim()};
    if (isWeighted) body['weight_kg'] = double.tryParse(weightCtrl.text) ?? 0.0;
    if (isEmployees) { body['role_operator'] = roleOp; body['role_helper'] = roleHelp; }
    if (isCustomers) { body['address'] = addressCtrl.text.isEmpty ? null : addressCtrl.text; body['gstin'] = gstinCtrl.text.isEmpty ? null : gstinCtrl.text; }
    if (isFirms) {
      if (addressCtrl.text.isNotEmpty) body['address'] = addressCtrl.text;
      if (gstinCtrl.text.isNotEmpty) body['gstin'] = gstinCtrl.text;
      if (mobileCtrl.text.isNotEmpty) body['mobile'] = mobileCtrl.text;
      if (emailCtrl.text.isNotEmpty) body['email'] = emailCtrl.text;
    }
    final res = await ApiClient.instance.dio.post('/master/$type', data: body);
    setState(() { _resetForm(); items.add(res.data as Map<String, dynamic>); });
  }

  Future<void> _saveEdit(Map<String, dynamic> i) async {
    if (edit == null) return;
    final body = <String, dynamic>{};
    if (isWeighted) { body['name'] = edit!['name']; body['weight_kg'] = (edit!['weight_kg'] ?? 0).toDouble(); }
    else if (isEmployees) { body['name'] = edit!['name']; body['role_operator'] = edit!['role_operator'] == true; body['role_helper'] = edit!['role_helper'] == true; }
    else if (isCustomers) { body['name'] = edit!['name']; body['address'] = edit!['address']; body['gstin'] = edit!['gstin']; }
    else if (isFirms) { body['name'] = edit!['name']; if (edit!['address'] != null) body['address'] = edit!['address']; if (edit!['gstin'] != null) body['gstin'] = edit!['gstin']; if (edit!['mobile'] != null) body['mobile'] = edit!['mobile']; if (edit!['email'] != null) body['email'] = edit!['email']; }
    else { body['name'] = edit!['name']; }
    final res = await ApiClient.instance.dio.put('/master/$type/${i['id']}', data: body);
    final updated = res.data as Map<String, dynamic>;
    setState(() { items = items.map((it) => (it['id'] == i['id']) ? updated : it).toList(); editingId = null; edit = null; });
  }

  Future<void> _remove(int id) async {
    await ApiClient.instance.dio.delete('/master/$type/$id');
    setState(() { items.removeWhere((e) => e['id'] == id); });
  }

  Future<void> _savePrinterSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('labelPrinter', labelPrinterCtrl.text);
    await prefs.setString('challanPrinter', challanPrinterCtrl.text);
    if (!mounted) return; ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Printer settings saved')));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 56,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            itemCount: tabs.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (ctx, i) {
              final t = tabs[i];
              final selected = type == t.$1;
              return ChoiceChip(
                selected: selected,
                label: Text(t.$2),
                onSelected: (_) { setState(() { type = t.$1; _resetForm(); }); _load(); },
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        if (isPrinterSettings) _printerSettings() else Expanded(child: _masterCrud()),
      ],
    );
  }

  Widget _masterCrud() {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                SizedBox(width: 260, child: TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()))),
                if (isWeighted) SizedBox(width: 200, child: TextField(controller: weightCtrl, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Weight (kg)', border: OutlineInputBorder()))),
                if (isEmployees)
                  Row(mainAxisSize: MainAxisSize.min, children: [
                    Checkbox(value: roleOp, onChanged: (v) => setState(() => roleOp = v ?? false)), const Text('Operator'), const SizedBox(width: 8),
                    Checkbox(value: roleHelp, onChanged: (v) => setState(() => roleHelp = v ?? false)), const Text('Helper'),
                  ]),
                if (isCustomers || isFirms) ...[
                  SizedBox(width: 360, child: TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()))),
                  SizedBox(width: 200, child: TextField(controller: gstinCtrl, decoration: const InputDecoration(labelText: 'GSTIN', border: OutlineInputBorder()))),
                  if (isFirms) ...[
                    SizedBox(width: 200, child: TextField(controller: mobileCtrl, decoration: const InputDecoration(labelText: 'Mobile', border: OutlineInputBorder()))),
                    SizedBox(width: 240, child: TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()))),
                  ]
                ],
                FilledButton(onPressed: _add, child: const Text('+ New')),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: SingleChildScrollView(
                child: DataTable(
                  columns: [
                    const DataColumn(label: Text('Name')),
                    if (isWeighted) const DataColumn(label: Text('Weight (kg)'), numeric: true),
                    if (isEmployees) const DataColumn(label: Text('Operator')),
                    if (isEmployees) const DataColumn(label: Text('Helper')),
                    if (isCustomers) const DataColumn(label: Text('Address')),
                    if (isCustomers) const DataColumn(label: Text('GSTIN')),
                    if (isFirms) const DataColumn(label: Text('Address')),
                    if (isFirms) const DataColumn(label: Text('GSTIN')),
                    if (isFirms) const DataColumn(label: Text('Mobile')),
                    if (isFirms) const DataColumn(label: Text('Email')),
                    const DataColumn(label: Text('Actions'), numeric: true),
                  ],
                  rows: items.map((i) {
                    final isEditing = editingId == i['id'];
                    return DataRow(cells: [
                      DataCell(isEditing ? SizedBox(width: 220, child: TextField(controller: TextEditingController(text: edit?['name'] ?? i['name']), onChanged: (v) => edit = {...?edit, 'name': v},)) : Text(i['name'] ?? '')),
                      if (isWeighted) DataCell(isEditing ? SizedBox(width: 140, child: TextField(controller: TextEditingController(text: (edit?['weight_kg'] ?? i['weight_kg'] ?? 0).toString()), onChanged: (v) => edit = {...?edit, 'weight_kg': double.tryParse(v) ?? 0.0}, keyboardType: const TextInputType.numberWithOptions(decimal: true),)) : Text(((i['weight_kg'] ?? 0) as num).toDouble().toStringAsFixed(3))),
                      if (isEmployees) DataCell(isEditing ? Checkbox(value: (edit?['role_operator'] ?? i['role_operator']) == true, onChanged: (v) => setState(() => edit = {...?edit, 'role_operator': v == true})) : Text((i['role_operator'] == true) ? 'Yes' : 'No')),
                      if (isEmployees) DataCell(isEditing ? Checkbox(value: (edit?['role_helper'] ?? i['role_helper']) == true, onChanged: (v) => setState(() => edit = {...?edit, 'role_helper': v == true})) : Text((i['role_helper'] == true) ? 'Yes' : 'No')),
                      if (isCustomers) DataCell(isEditing ? SizedBox(width: 240, child: TextField(controller: TextEditingController(text: edit?['address'] ?? i['address'] ?? ''), onChanged: (v) => edit = {...?edit, 'address': v},)) : Text((i['address'] ?? '').toString())),
                      if (isCustomers) DataCell(isEditing ? SizedBox(width: 160, child: TextField(controller: TextEditingController(text: edit?['gstin'] ?? i['gstin'] ?? ''), onChanged: (v) => edit = {...?edit, 'gstin': v},)) : Text((i['gstin'] ?? '').toString())),
                      if (isFirms) DataCell(isEditing ? SizedBox(width: 240, child: TextField(controller: TextEditingController(text: edit?['address'] ?? i['address'] ?? ''), onChanged: (v) => edit = {...?edit, 'address': v},)) : Text((i['address'] ?? '').toString())),
                      if (isFirms) DataCell(isEditing ? SizedBox(width: 160, child: TextField(controller: TextEditingController(text: edit?['gstin'] ?? i['gstin'] ?? ''), onChanged: (v) => edit = {...?edit, 'gstin': v},)) : Text((i['gstin'] ?? '').toString())),
                      if (isFirms) DataCell(isEditing ? SizedBox(width: 140, child: TextField(controller: TextEditingController(text: edit?['mobile'] ?? i['mobile'] ?? ''), onChanged: (v) => edit = {...?edit, 'mobile': v},)) : Text((i['mobile'] ?? '').toString())),
                      if (isFirms) DataCell(isEditing ? SizedBox(width: 180, child: TextField(controller: TextEditingController(text: edit?['email'] ?? i['email'] ?? ''), onChanged: (v) => edit = {...?edit, 'email': v},)) : Text((i['email'] ?? '').toString())),
                      DataCell(Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                        if (!isEditing) ...[
                          TextButton(onPressed: () => setState(() { editingId = i['id'] as int; edit = Map<String, dynamic>.from(i); }), child: const Text('Edit')),
                          const SizedBox(width: 8),
                          OutlinedButton(onPressed: () => _remove(i['id'] as int), child: const Text('Delete')),
                        ] else ...[
                          TextButton(onPressed: () => _saveEdit(i), child: const Text('Save')),
                          const SizedBox(width: 8),
                          OutlinedButton(onPressed: () => setState(() { editingId = null; edit = null; }), child: const Text('Cancel')),
                        ],
                      ])),
                    ]);
                  }).toList(),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _printerSettings() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Printer Configuration', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              if (availablePrinters.isEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
                  child: const Text('No printers detected from app. You can still save preferred names and the app will attempt direct print.'),
                ),
                const SizedBox(height: 8),
              ],
              Wrap(spacing: 12, runSpacing: 12, children: [
                SizedBox(
                  width: 340,
                  child: availablePrinters.isEmpty
                      ? TextField(controller: labelPrinterCtrl, decoration: const InputDecoration(labelText: 'Label Printer', border: OutlineInputBorder()))
                      : DropdownButtonFormField<String>(
                          value: labelPrinterCtrl.text.isEmpty ? null : labelPrinterCtrl.text,
                          items: availablePrinters.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                          onChanged: (v) => labelPrinterCtrl.text = v ?? '',
                          decoration: const InputDecoration(labelText: 'Label Printer', border: OutlineInputBorder()),
                        ),
                ),
                SizedBox(
                  width: 340,
                  child: availablePrinters.isEmpty
                      ? TextField(controller: challanPrinterCtrl, decoration: const InputDecoration(labelText: 'Challan Printer', border: OutlineInputBorder()))
                      : DropdownButtonFormField<String>(
                          value: challanPrinterCtrl.text.isEmpty ? null : challanPrinterCtrl.text,
                          items: availablePrinters.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                          onChanged: (v) => challanPrinterCtrl.text = v ?? '',
                          decoration: const InputDecoration(labelText: 'Challan Printer', border: OutlineInputBorder()),
                        ),
                ),
                FilledButton(onPressed: _savePrinterSettings, child: const Text('Save Printer Settings')),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}


