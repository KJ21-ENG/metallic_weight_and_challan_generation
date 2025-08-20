import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/api.dart';
import '../utils/parsing.dart';
import '../printing/label_printer.dart';

class ChallanPage extends StatefulWidget {
  const ChallanPage({super.key});
  @override
  State<ChallanPage> createState() => _ChallanPageState();
}

class OptionItem {
  final int id;
  final String name;
  final double? weightKg;
  final bool? roleOperator;
  final bool? roleHelper;
  const OptionItem({required this.id, required this.name, this.weightKg, this.roleOperator, this.roleHelper});

  factory OptionItem.fromJson(Map<String, dynamic> j) => OptionItem(
    id: asInt(j['id']),
    name: asString(j['name']),
    weightKg: j.containsKey('weight_kg') ? asDouble(j['weight_kg']) : null,
    roleOperator: j.containsKey('role_operator') ? asBool(j['role_operator']) : null,
    roleHelper: j.containsKey('role_helper') ? asBool(j['role_helper']) : null,
  );
}

class BasketItem {
  int metallicId;
  int cutId;
  int operatorId;
  int? helperId;
  int bobTypeId;
  int boxTypeId;
  int bobQty;
  double grossWt;
  BasketItem({
    required this.metallicId,
    required this.cutId,
    required this.operatorId,
    this.helperId,
    required this.bobTypeId,
    required this.boxTypeId,
    required this.bobQty,
    required this.grossWt,
  });

  Map<String, dynamic> toJson() => {
    'metallic_id': metallicId,
    'cut_id': cutId,
    'operator_id': operatorId,
    'helper_id': helperId,
    'bob_type_id': bobTypeId,
    'box_type_id': boxTypeId,
    'bob_qty': bobQty,
    'gross_wt': grossWt,
  };
}

class _ChallanPageState extends State<ChallanPage> {
  final dateCtrl = TextEditingController(text: DateFormat('yyyy-MM-dd').format(DateTime.now()));

  List<OptionItem> customers = [];
  List<OptionItem> shifts = [];
  List<OptionItem> metallics = [];
  List<OptionItem> cuts = [];
  List<OptionItem> employees = [];
  List<OptionItem> bobTypes = [];
  List<OptionItem> boxTypes = [];
  List<Map<String, dynamic>> firms = [];

  int customerId = 0;
  int shiftId = 0;
  int firmId = 0;
  int? reservedChallanNo;

  int metallicId = 0;
  int cutId = 0;
  int operatorId = 0;
  int? helperId = 0;
  int bobTypeId = 0;
  int boxTypeId = 0;
  late TextEditingController bobQtyCtrl;
  late TextEditingController grossWtCtrl;

  final List<BasketItem> basket = [];

  @override
  void initState() {
    super.initState();
    bobQtyCtrl = TextEditingController();
    grossWtCtrl = TextEditingController();
    _loadOptions();
  }

  @override
  void dispose() {
    bobQtyCtrl.dispose();
    grossWtCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadOptions() async {
    final r = await Future.wait([
      getOptions('customers'),
      getOptions('shifts'),
      getOptions('metallics'),
      getOptions('cuts'),
      getOptions('employees'),
      getOptions('bob_types'),
      getOptions('box_types'),
      getOptions('firms'),
    ]);
    setState(() {
      customers = (r[0] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      shifts = (r[1] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      metallics = (r[2] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      cuts = (r[3] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      employees = (r[4] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      bobTypes = (r[5] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      boxTypes = (r[6] as List).map((e) => OptionItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
      firms = (r[7] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    });
  }

  double _weightOf(List<OptionItem> opts, int id) =>
      opts.firstWhere((o) => o.id == id, orElse: () => const OptionItem(id: 0, name: '')).weightKg ?? 0.0;
  String _nameOf(List<OptionItem> opts, int id) =>
      opts.firstWhere((o) => o.id == id, orElse: () => const OptionItem(id: 0, name: '')).name;

  double get bobWt => _weightOf(bobTypes, bobTypeId);
  double get boxWt => _weightOf(boxTypes, boxTypeId);
  double get tare => ((int.tryParse(bobQtyCtrl.text) ?? 0) * bobWt + boxWt).toDoubleAs3();
  double get net => ((double.tryParse(grossWtCtrl.text) ?? 0.0) - tare).toDoubleAs3();

  void _addToBasket() async {
    final int bobQtyVal = int.tryParse(bobQtyCtrl.text) ?? 0;
    final double grossVal = double.tryParse(grossWtCtrl.text) ?? 0.0;
    final missing = metallicId == 0 || cutId == 0 || operatorId == 0 || bobTypeId == 0 || boxTypeId == 0 ||
        bobQtyCtrl.text.trim().isEmpty || grossWtCtrl.text.trim().isEmpty || bobQtyVal <= 0 || grossVal <= 0.0;
    if (missing) {
      _alert('Please fill all item fields (Metallic, Cut, Operator, Bob Type, Box Type, Bob Qty and Gross Weight)');
      return;
    }

    final item = BasketItem(
      metallicId: metallicId,
      cutId: cutId,
      operatorId: operatorId,
      helperId: (helperId == 0) ? null : helperId,
      bobTypeId: bobTypeId,
      boxTypeId: boxTypeId,
      bobQty: bobQtyVal,
      grossWt: grossVal.toDoubleAs3(),
    );
    setState(() => basket.add(item));

    // peek challan number
    if (reservedChallanNo == null) {
      try {
        final res = await ApiClient.instance.dio.get('/challans/peek-next-number');
        reservedChallanNo = (res.data['nextNumber'] as num).toInt();
      } catch (_) {}
    }

    final idx = basket.length; // 1-based after adding
    final yy = DateFormat('yy').format(DateFormat('yyyy-MM-dd').parse(dateCtrl.text));
    final challanStr = (reservedChallanNo ?? 0).toString().padLeft(6, '0');
    final itemStr = idx.toString().padLeft(2, '0');
    final barcode = 'CH-$yy-$challanStr-$itemStr';

    final firmName = () {
      if (firmId == 0) return 'FIRM NAME';
      final m = firms.firstWhere((f) => asInt(f['id']) == firmId, orElse: () => {'name': 'FIRM NAME'});
      return asString(m['name'], fallback: 'FIRM NAME');
    }();

    await LabelPrinter.printLabel(
      header: firmName,
      dateText: DateFormat('dd/MM/yyyy\nHH:mm').format(DateTime.now()),
      color: _nameOf(metallics, item.metallicId),
      cut: _nameOf(cuts, item.cutId),
      bobQty: item.bobQty,
      gross: item.grossWt,
      bobWeight: _weightOf(bobTypes, item.bobTypeId),
      boxWeight: _weightOf(boxTypes, item.boxTypeId),
      net: net,
      operator: _nameOf(employees, item.operatorId),
      helper: item.helperId == null ? '' : _nameOf(employees, item.helperId!),
      barcode: barcode,
      tare: tare,
      boxType: _nameOf(bobTypes, item.bobTypeId),
      firmName: firmName,
    );
    // Clear only the weight-related inputs for next entry
    bobQtyCtrl.clear();
    grossWtCtrl.clear();
  }

  Future<void> _generateChallan() async {
    if (customerId == 0 || shiftId == 0 || basket.isEmpty) {
      _alert('Fill header and add items');
      return;
    }
    final payload = {
      'date': dateCtrl.text,
      'customer_id': customerId,
      'shift_id': shiftId,
      if (firmId != 0) 'firm_id': firmId,
      'items': basket.map((e) => e.toJson()).toList(),
      if (reservedChallanNo != null) 'challan_no': reservedChallanNo,
    };
    final res = await ApiClient.instance.dio.post('/challans', data: payload);
    final challan = Map<String, dynamic>.from(res.data['challan'] as Map);
    final challanNo = asInt(challan['challan_no']);
    _alert('Challan generated successfully! Challan No: $challanNo');
    setState(() {
      reservedChallanNo = null;
      basket.clear();
    });
  }

  void _removeAt(int i) {
    setState(() {
      basket.removeAt(i);
      if (basket.isEmpty) reservedChallanNo = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Generate Challan', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                runSpacing: 12,
                spacing: 12,
                children: [
                  _dateField('Date', dateCtrl),
                  _select('Customer', customerId, [const DropdownMenuItem(value: 0, child: Text('Select')),...customers.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))], (v) => setState(() => customerId = v ?? 0)),
                  _select('Shift', shiftId, [const DropdownMenuItem(value: 0, child: Text('Select')),...shifts.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))], (v) => setState(() => shiftId = v ?? 0)),
                  _select('Firm', firmId, [const DropdownMenuItem(value: 0, child: Text('Select')),...firms.map((f) => DropdownMenuItem(value: asInt(f['id']), child: Text(asString(f['name']))))], (v) => setState(() => firmId = v ?? 0)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                runSpacing: 12,
                spacing: 12,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  _select('Metallic', metallicId, [const DropdownMenuItem(value: 0, child: Text('Select')),...metallics.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))], (v) => setState(() => metallicId = v ?? 0)),
                  _select('Cut', cutId, [const DropdownMenuItem(value: 0, child: Text('Select')),...cuts.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))], (v) => setState(() => cutId = v ?? 0)),
                  _select('Operator', operatorId, [const DropdownMenuItem(value: 0, child: Text('Select')),...employees.where((e) => e.roleOperator == true).map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))], (v) => setState(() => operatorId = v ?? 0)),
                  _select('Helper', helperId ?? 0, [const DropdownMenuItem(value: 0, child: Text('None')),...employees.where((e) => e.roleHelper == true).map((e) => DropdownMenuItem(value: e.id, child: Text(e.name)))], (v) => setState(() => helperId = v)),
                  _select('Bob Type', bobTypeId, [const DropdownMenuItem(value: 0, child: Text('Select')),...bobTypes.map((e) => DropdownMenuItem(value: e.id, child: Text('${e.name} (${(e.weightKg ?? 0).toStringAsFixed(3)} kg)')))], (v) => setState(() => bobTypeId = v ?? 0)),
                  _select('Box Type', boxTypeId, [const DropdownMenuItem(value: 0, child: Text('Select')),...boxTypes.map((e) => DropdownMenuItem(value: e.id, child: Text('${e.name} (${(e.weightKg ?? 0).toStringAsFixed(3)} kg)')))], (v) => setState(() => boxTypeId = v ?? 0)),
                  _numField('Bob Qty', '', (v) => setState(() => bobQtyCtrl.text = v), isInt: true, controller: bobQtyCtrl),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _numField('Gross Weight (kg)', '', (v) => setState(() => grossWtCtrl.text = v), controller: grossWtCtrl),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () async {
                          final val = await _promptWeight(context);
                          if (val != null) setState(() => grossWtCtrl.text = val.toStringAsFixed(3));
                        },
                        child: const Text('Catch'),
                      )
                    ],
                  ),
                  _metrics('Bob Weight', bobWt.toStringAsFixed(3)),
                  _metrics('Box Weight', boxWt.toStringAsFixed(3)),
                  _metrics('Tare Weight', tare.toStringAsFixed(3)),
                  _metrics('Net Weight', net.toStringAsFixed(3)),
                  FilledButton(onPressed: _addToBasket, child: const Text('Add to Basket')),
                ],
              ),
            ),
          ),

          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (reservedChallanNo != null)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Reserved Challan Number: $reservedChallanNo\nThis number will be used for all items in this basket', style: TextStyle(color: Theme.of(context).colorScheme.onPrimaryContainer)),
                    ),
                  DataTable(
                    columns: const [
                      DataColumn(label: Text('#')),
                      DataColumn(label: Text('Metallic')),
                      DataColumn(label: Text('Cut')),
                      DataColumn(label: Text('Bob')),
                      DataColumn(label: Text('Box')),
                      DataColumn(label: Text('Qty'), numeric: true),
                      DataColumn(label: Text('Gross'), numeric: true),
                      DataColumn(label: Text('Tare'), numeric: true),
                      DataColumn(label: Text('Net'), numeric: true),
                      DataColumn(label: Text('')),
                    ],
                    rows: [
                      ...basket.asMap().entries.map((e) {
                        final i = e.key;
                        final b = e.value;
                        final bw = _weightOf(bobTypes, b.bobTypeId);
                        final bxw = _weightOf(boxTypes, b.boxTypeId);
                        final t = ((b.bobQty) * bw + bxw).toDoubleAs3();
                        final n = (b.grossWt - t).toDoubleAs3();
                        return DataRow(cells: [
                          DataCell(Text('${i + 1}')),
                          DataCell(Text(_nameOf(metallics, b.metallicId))),
                          DataCell(Text(_nameOf(cuts, b.cutId))),
                          DataCell(Text(_nameOf(bobTypes, b.bobTypeId))),
                          DataCell(Text(_nameOf(boxTypes, b.boxTypeId))),
                          DataCell(Text('${b.bobQty}')),
                          DataCell(Text(b.grossWt.toStringAsFixed(3))),
                          DataCell(Text(t.toStringAsFixed(3))),
                          DataCell(Text(n.toStringAsFixed(3))),
                          DataCell(OutlinedButton(onPressed: () => _removeAt(i), child: const Text('Remove'))),
                        ]);
                      }),
                      if (basket.isNotEmpty)
                        () {
                          int totalQty = 0;
                          double totalNet = 0;
                          for (final b in basket) {
                            final bw = _weightOf(bobTypes, b.bobTypeId);
                            final bxw = _weightOf(boxTypes, b.boxTypeId);
                            final t = ((b.bobQty) * bw + bxw).toDoubleAs3();
                            final n = (b.grossWt - t).toDoubleAs3();
                            totalQty += b.bobQty;
                            totalNet += n;
                          }
                          return DataRow(cells: [
                            const DataCell(Text('Totals', style: TextStyle(fontWeight: FontWeight.w600))),
                            const DataCell(Text('')),
                            const DataCell(Text('')),
                            const DataCell(Text('')),
                            const DataCell(Text('')),
                            DataCell(Text('$totalQty')),
                            const DataCell(Text('')),
                            const DataCell(Text('')),
                            DataCell(Text(totalNet.toStringAsFixed(3))),
                            const DataCell(Text('')),
                          ]);
                        }(),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(onPressed: () => setState(() { basket.clear(); reservedChallanNo = null; }), child: const Text('Clear Basket')),
                      const SizedBox(width: 8),
                      FilledButton(onPressed: (customerId == 0 || shiftId == 0 || basket.isEmpty) ? null : _generateChallan, child: const Text('Generate Challan')),
                    ],
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  DropdownButtonFormField<int> _select(String label, int value, List<DropdownMenuItem<int>> items, ValueChanged<int?> onChanged) {
    return DropdownButtonFormField<int>(
      value: value,
      items: items,
      onChanged: onChanged,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
    );
  }

  Widget _numField(String label, String value, ValueChanged<String> onChanged, {bool isInt = false, TextEditingController? controller}) {
    return SizedBox(
      width: 240,
      child: TextFormField(
        controller: controller,
        initialValue: controller == null ? value : null,
        onChanged: onChanged,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      ),
    );
  }

  Widget _dateField(String label, TextEditingController controller) {
    return SizedBox(
      width: 240,
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
        readOnly: true,
        onTap: () async {
          final initial = DateTime.tryParse(controller.text) ?? DateTime.now();
          final picked = await showDatePicker(context: context, firstDate: DateTime(2020), lastDate: DateTime(2100), initialDate: initial);
          if (picked != null) controller.text = DateFormat('yyyy-MM-dd').format(picked);
        },
      ),
    );
  }

  Widget _metrics(String label, String value) {
    return SizedBox(
      width: 200,
      child: Text('$label: $value'),
    );
  }

  Future<double?> _promptWeight(BuildContext context) async {
    // Try HTTP capture (weight wrapper) first (Electron uses IPC; Flutter desktop will call local service)
    try {
      final res = await ApiClient.instance.dio.get('http://localhost:5001/capture');
      if (res.statusCode == 200 && res.data != null && res.data['ok'] == true) {
        final w = res.data['weight'];
        final d = asDouble(w);
        return d;
      }
    } catch (e) {
      // ignore and fall back to manual dialog
      debugPrint('HTTP weight capture failed: $e');
    }

    final ctrl = TextEditingController();
    final res = await showDialog<double?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Enter weight (kg)'),
        content: TextField(controller: ctrl, keyboardType: const TextInputType.numberWithOptions(decimal: true)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () {
            final n = double.tryParse(ctrl.text);
            Navigator.pop(ctx, n);
          }, child: const Text('OK')),
        ],
      ),
    );
    return res;
  }

  void _alert(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }
}

extension on double {
  double toDoubleAs3() => double.parse(toStringAsFixed(3));
}


