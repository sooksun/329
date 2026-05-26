import 'package:flutter/material.dart';

class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({super.key, this.itemCount = 5});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) => const _SkeletonCard(),
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemCount: itemCount,
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Bar(widthFactor: .45, height: 12),
            SizedBox(height: 14),
            _Bar(widthFactor: .85, height: 22),
            SizedBox(height: 12),
            _Bar(widthFactor: 1, height: 10),
            SizedBox(height: 8),
            _Bar(widthFactor: .35, height: 10),
          ],
        ),
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.widthFactor, required this.height});

  final double widthFactor;
  final double height;

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: widthFactor,
      alignment: Alignment.centerLeft,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(.08),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}
