import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/thai_date.dart';
import '../providers/app_state.dart';
import '../widgets/kpi_card.dart';
import '../widgets/loading_skeleton.dart';

class OverviewScreen extends StatelessWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final data = state.dashboardData;
    if (data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('ภาพรวม')),
        body: const LoadingSkeleton(itemCount: 4),
      );
    }
    final project = data.projectKpi;
    final my = data.myKpi;
    return Scaffold(
      appBar: AppBar(
        title: const Text('ภาพรวม'),
        actions: [
          IconButton(
            onPressed: state.isBusy ? null : () => state.refreshAll(),
            icon: const Icon(Icons.refresh),
            tooltip: 'รีเฟรช',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: state.refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              data.project.name,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 4),
            const Text('รอบจัดงาน 29 มี.ค. – 5 เม.ย. 2570'),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: MediaQuery.sizeOf(context).width > 520 ? 3 : 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.05,
              children: [
                KpiCard(
                    label: 'ความคืบหน้ารวม',
                    value: '${project.overall}%',
                    icon: Icons.trending_up),
                KpiCard(
                    label: 'งานทั้งหมด',
                    value: '${project.totalTasks}',
                    caption: 'ล่าช้า ${project.delayedTasks} งาน'),
                KpiCard(
                    label: 'หลักฐานรอตรวจ',
                    value: '${project.evidencePending}'),
                KpiCard(
                    label: 'วันเหลือก่อนงาน',
                    value: '${project.daysRemaining}'),
                KpiCard(
                    label: 'งบใช้จริง',
                    value: formatBudgetMillion(project.actualBudget)),
                KpiCard(
                    label: 'งบวางแผน',
                    value: formatBudgetMillion(project.plannedBudget)),
              ],
            ),
            const SizedBox(height: 12),
            const Text('งานของฉัน',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            GridView.count(
              crossAxisCount: MediaQuery.sizeOf(context).width > 520 ? 3 : 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.2,
              children: [
                KpiCard(label: 'งานย่อยของฉัน', value: '${my.subtasksTotal}'),
                KpiCard(label: 'ค้างดำเนินการ', value: '${my.subtasksPending}'),
                KpiCard(label: 'ล่าช้า', value: '${my.subtasksDelayed}'),
                KpiCard(label: 'รอตรวจ', value: '${my.evidencePending}'),
                KpiCard(label: 'ถูกปฏิเสธ', value: '${my.evidenceRejected}'),
                KpiCard(
                    label: 'ความคืบหน้าคณะ', value: '${my.committeeProgress}%'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
