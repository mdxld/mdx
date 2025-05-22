import * as React from 'react'
import { 
  Area, 
  Bar, 
  CartesianGrid, 
  Cell, 
  ComposedChart, 
  Legend, 
  Line, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Scatter, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts'

import { cn } from '../../lib/utils.js'

const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
Chart.displayName = 'Chart'

const ChartPie = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    data: Record<string, unknown>[]
    dataKey: string
    nameKey: string
    innerRadius?: number
    outerRadius?: number
    paddingAngle?: number
    colors?: string[]
  }
>(
  (
    {
      className,
      data,
      dataKey,
      nameKey,
      innerRadius = 0,
      outerRadius = 80,
      paddingAngle = 0,
      colors,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn('h-80 w-full', className)}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  colors
                    ? colors[index % colors.length]
                    : `hsl(${
                        index * (360 / data.length)
                      } 40% 40%)`
                }
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
)
ChartPie.displayName = 'ChartPie'

const ChartComposed = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    data: Record<string, unknown>[]
    margin?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
    xAxisDataKey?: string
    xAxisLabel?: string
    yAxisLabel?: string
    showGrid?: boolean
    showXAxis?: boolean
    showYAxis?: boolean
    showTooltip?: boolean
    showLegend?: boolean
    children: React.ReactNode
  }
>(
  (
    {
      className,
      data,
      margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      xAxisDataKey = 'name',
      xAxisLabel,
      yAxisLabel,
      showGrid = true,
      showXAxis = true,
      showYAxis = true,
      showTooltip = true,
      showLegend = true,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn('h-80 w-full', className)}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={margin}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {showXAxis && (
            <XAxis
              dataKey={xAxisDataKey}
              label={
                xAxisLabel
                  ? {
                      value: xAxisLabel,
                      position: 'insideBottom',
                      offset: -10,
                    }
                  : undefined
              }
            />
          )}
          {showYAxis && (
            <YAxis
              label={
                yAxisLabel
                  ? {
                      value: yAxisLabel,
                      angle: -90,
                      position: 'insideLeft',
                    }
                  : undefined
              }
            />
          )}
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
          {children}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
)
ChartComposed.displayName = 'ChartComposed'

const ChartArea = React.forwardRef<
  React.ElementRef<typeof Area>,
  React.ComponentPropsWithoutRef<typeof Area>
>(({ className, ...props }, ref) => (
  <Area ref={ref} className={cn('', className)} {...props} />
))
ChartArea.displayName = 'ChartArea'

const ChartBar = React.forwardRef<
  React.ElementRef<typeof Bar>,
  React.ComponentPropsWithoutRef<typeof Bar>
>(({ className, ...props }, ref) => (
  <Bar ref={ref} className={cn('', className)} {...props} />
))
ChartBar.displayName = 'ChartBar'

const ChartLine = React.forwardRef<
  React.ElementRef<typeof Line>,
  React.ComponentPropsWithoutRef<typeof Line>
>(({ className, ...props }, ref) => (
  <Line ref={ref} className={cn('', className)} {...props} />
))
ChartLine.displayName = 'ChartLine'

const ChartScatter = React.forwardRef<
  React.ElementRef<typeof Scatter>,
  React.ComponentPropsWithoutRef<typeof Scatter>
>(({ className, ...props }, ref) => (
  <Scatter ref={ref} className={cn('', className)} {...props} />
))
ChartScatter.displayName = 'ChartScatter'

export {
  Chart,
  ChartPie,
  ChartComposed,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartScatter,
}
