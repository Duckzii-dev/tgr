import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
  } from 'recharts';
  
  export default function LineChartCard({
    data,
    xKey = 'date',
    lines,
    height = 260,
    yLabel,
  }) {
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#262c35" strokeDasharray="3 3" />
            <XAxis dataKey={xKey} stroke="#8a93a0" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#8a93a0"
              tick={{ fontSize: 11 }}
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#8a93a0',
                      fontSize: 11,
                    }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                background: '#111317',
                border: '1px solid #262c35',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name || l.key}
                stroke={l.color || '#c6ff3d'}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }