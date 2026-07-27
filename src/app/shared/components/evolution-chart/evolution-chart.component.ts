import {
  Component, OnChanges, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, input, output, signal, computed,
} from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import * as d3 from 'd3';
import { ChartPeriod, PortfolioHistoryPoint } from '../../../core/models/account.model';

interface DataPoint {
  date:  Date;
  value: number;
  raw:   PortfolioHistoryPoint;
}

@Component({
  selector: 'app-evolution-chart',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, TranslatePipe],
  templateUrl: './evolution-chart.component.html',
})
export class EvolutionChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  points       = input<PortfolioHistoryPoint[]>([]);
  loading      = input<boolean>(false);
  currency     = input<string>('EUR');
  currentValue = input<number | null>(null);

  protected readonly selectedPeriod = signal<ChartPeriod>('ONE_MONTH');
  periodChanged = output<ChartPeriod>();

  protected readonly hoveredPoint = signal<PortfolioHistoryPoint | null>(null);
  protected readonly tooltipX = signal(0);
  protected readonly tooltipY = signal(0);

  @ViewChild('chartContainer')
  private chartContainer!: ElementRef<HTMLDivElement>;

  private resizeObserver?: ResizeObserver;

  protected readonly PERIODS: { value: ChartPeriod; labelKey: string }[] = [
    { value: 'ONE_DAY',   labelKey: 'chart.period.1D' },
    { value: 'ONE_WEEK',  labelKey: 'chart.period.1W' },
    { value: 'ONE_MONTH', labelKey: 'chart.period.1M' },
    { value: 'YTD',       labelKey: 'chart.period.YTD' },
    { value: 'ONE_YEAR',  labelKey: 'chart.period.1Y' },
    { value: 'ALL',       labelKey: 'chart.period.ALL' },
  ];

  protected readonly effectivePoints = computed((): PortfolioHistoryPoint[] => {
    const pts  = this.points();
    const curr = this.currentValue();
    if (!pts.length || curr === null) return pts;
    return pts.map((p, i) =>
      i === pts.length - 1 ? { ...p, value: curr } : p
    );
  });

  protected readonly isPositive = computed(() => {
    const pts = this.effectivePoints();
    if (pts.length < 2) return true;
    return pts[pts.length - 1].value >= pts[0].value;
  });

  protected readonly latestValue = computed(() => {
    const pts = this.effectivePoints();
    return pts.length > 0 ? pts[pts.length - 1].value : 0;
  });

  protected readonly changeValue = computed(() => {
    const pts = this.effectivePoints();
    if (pts.length < 2) return 0;
    const firstNonZero = pts.find(p => p.value > 0);
    if (!firstNonZero) return 0;
    return pts[pts.length - 1].value - firstNonZero.value;
  });

  protected readonly changePct = computed(() => {
    const pts = this.effectivePoints();
    if (pts.length < 2) return 0;
    const firstNonZero = pts.find(p => p.value > 0);
    if (!firstNonZero) return 0;
    return ((pts[pts.length - 1].value - firstNonZero.value) / firstNonZero.value) * 100;
  });

  ngAfterViewInit(): void {
    // chartContainer only exists in the @else branch when points.length >= 2
    setTimeout(() => {
      if (this.chartContainer?.nativeElement) {
        this.renderChart();
        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.renderChart());
          this.resizeObserver.observe(this.chartContainer.nativeElement);
        }
      }
    }, 0);
  }

  ngOnChanges(): void {
    setTimeout(() => {
      if (this.chartContainer?.nativeElement) {
        if (!this.resizeObserver && typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.renderChart());
          this.resizeObserver.observe(this.chartContainer.nativeElement);
        }
        this.renderChart();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected selectPeriod(period: ChartPeriod): void {
    this.selectedPeriod.set(period);
    this.hoveredPoint.set(null);
    this.periodChanged.emit(period);
  }

  private renderChart(): void {
    const pts       = this.effectivePoints();
    const container = this.chartContainer?.nativeElement;
    if (!container || pts.length < 2) return;
    const totalW    = container.clientWidth || 600;
    const totalH    = 200;
    const margin    = { top: 10, right: 16, bottom: 30, left: 16 };
    const W = totalW - margin.left - margin.right;
    const H = totalH - margin.top  - margin.bottom;

    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', totalW)
      .attr('height', totalH);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data: DataPoint[] = pts.map(p => ({
      date:  new Date(p.date),
      value: p.value,
      raw:   p,
    }));

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, W]);

    const [minV, maxV] = d3.extent(data, d => d.value) as [number, number];
    const padding = (maxV - minV) * 0.1 || maxV * 0.05 || 1;
    const yScale = d3.scaleLinear()
      .domain([Math.max(0, minV - padding), maxV + padding])
      .range([H, 0])
      .nice();

    const color = this.isPositive() ? '#10b981' : '#ef4444';

    const gradId = 'chartGrad-' + Math.random().toString(36).slice(2);
    const defs   = svg.append('defs');
    const grad   = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1');
    grad.append('stop').attr('offset', '0%')
      .attr('stop-color', color).attr('stop-opacity', 0.3);
    grad.append('stop').attr('offset', '100%')
      .attr('stop-color', color).attr('stop-opacity', 0);

    const area = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(H)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(data)
      .attr('fill', `url(#${gradId})`)
      .attr('d', area);

    const line = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    const period = this.selectedPeriod();
    const xTickFormat: (d: Date) => string = period === 'ONE_DAY'
      ? d3.timeFormat('%H:%M')
      : period === 'ONE_WEEK' || period === 'ONE_MONTH'
        ? d3.timeFormat('%d %b')
        : period === 'YTD' || period === 'ONE_YEAR'
          ? d3.timeFormat('%b %Y')
          : d3.timeFormat('%Y');

    const xTicks = period === 'ONE_DAY' ? 6
      : period === 'ONE_WEEK' ? 7
      : period === 'ONE_MONTH' ? 6
      : period === 'YTD' || period === 'ONE_YEAR' ? 6
      : 5;

    const formatXTick = (d: Date | d3.NumberValue): string =>
      xTickFormat(d instanceof Date ? d : new Date(Number(d)));

    g.append('g')
      .attr('transform', `translate(0,${H})`)
      .call(d3.axisBottom(xScale).ticks(xTicks).tickFormat(formatXTick))
      .call(gx => {
        gx.select('.domain').remove();
        gx.selectAll('line').remove();
        gx.selectAll('text').style('fill', '#94a3b8').style('font-size', '11px');
      });

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-W).tickFormat(() => ''))
      .call(gy => {
        gy.select('.domain').remove();
        gy.selectAll('line')
          .style('stroke', '#1e293b')
          .style('stroke-dasharray', '1,4')
          .style('stroke-width', '1');
        gy.selectAll('text').remove();
      });

    const bisect = d3.bisector((d: DataPoint) => d.date).left;

    const focusLine = g.append('line')
      .attr('stroke', '#94a3b8').attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('y1', 0).attr('y2', H)
      .style('opacity', 0);

    const focusDot = g.append('circle')
      .attr('r', 4).attr('fill', color)
      .attr('stroke', 'white').attr('stroke-width', 2)
      .style('opacity', 0);

    g.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const x0   = xScale.invert(mx);
        const i    = bisect(data, x0, 1);
        const d0   = data[i - 1];
        const d1   = data[i] ?? d0;
        const d    = (x0.valueOf() - d0.date.valueOf()) >
                     (d1.date.valueOf() - x0.valueOf()) ? d1 : d0;

        const cx = xScale(d.date);
        const cy = yScale(d.value);
        focusLine.attr('x1', cx).attr('x2', cx).style('opacity', 1);
        focusDot.attr('cx', cx).attr('cy', cy).style('opacity', 1);
        this.hoveredPoint.set(d.raw);
        this.tooltipX.set(cx + margin.left + 8);
        this.tooltipY.set(cy + margin.top - 20);
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        focusDot.style('opacity', 0);
        this.hoveredPoint.set(null);
      });
  }
}
