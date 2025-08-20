import 'package:flutter/material.dart';
import 'pages/challan_page.dart';
import 'pages/master_page.dart';
import 'pages/management_page.dart';
import 'pages/reports_page.dart';

class MetallicApp extends StatelessWidget {
  const MetallicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Metallic Weight & Challan',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
        visualDensity: VisualDensity.comfortable,
      ),
      home: const _Layout(),
    );
  }
}

class _Layout extends StatefulWidget {
  const _Layout();
  @override
  State<_Layout> createState() => _LayoutState();
}

class _LayoutState extends State<_Layout> {
  int _index = 0;

  final _pages = const [
    ChallanPage(),
    MasterPage(),
    ManagementPage(),
    ReportsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Metallic Weight & Challan'),
      ),
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            labelType: NavigationRailLabelType.all,
            destinations: const [
              NavigationRailDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: Text('Challan')),
              NavigationRailDestination(icon: Icon(Icons.tune_outlined), selectedIcon: Icon(Icons.tune), label: Text('Master')),
              NavigationRailDestination(icon: Icon(Icons.manage_history_outlined), selectedIcon: Icon(Icons.manage_history), label: Text('Manage')),
              NavigationRailDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: Text('Reports')),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: _pages[_index]),
        ],
      ),
    );
  }
}


