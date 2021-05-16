import { useCallback, useState, useRef } from 'react';
import useAnimationFrame from 'use-animation-frame';
import useEventListener from '@use-it/event-listener';

// Styles
import './App.css';

// by this person: https://stackoverflow.com/a/1501725/4307769
function sqr(x) {
    return x * x;
}

function dist2(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function distToSegment(p, v, w) {
    const l2 = dist2(v, w);
    if (l2 == 0) {
        return dist2(p, v);
    }

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const x = v.x + t * (w.x - v.x);
    const y =v.y + t * (w.y - v.y);
    return {
        distance: Math.sqrt(dist2(p, { x, y })),
        x,
        y,
    };
}

function App() {
    const [currentMousePosition, setCurrentMousePosition] = useState({});
    const [linePoints, setLinePoints] = useState([]);
    const [positions, setPositions] = useState([]);
    const [polylines, setPolylines] = useState([]);
    const ref = useRef(null);
    const snapDistance = 30;

    useEventListener('keydown', (event) => {
        if (event.keyCode === 27) {
            setPolylines([
                ...polylines,
                positions,
            ]);
            setPositions([]);
            setLinePoints([]);
        }
    });

    useAnimationFrame(() => {
        if (!ref.current) {
            return;
        }

        const canvas = ref.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        const drawLines = (loopPositions) => {
            context.beginPath();
            context.moveTo(loopPositions[0].x, loopPositions[0].y);
            context.lineTo(loopPositions[1].x, loopPositions[1].y);
            context.stroke();
        }

        polylines.forEach((polyline) => {
            polyline.forEach(drawLines);
        });
        positions.forEach(drawLines);

        const lastPosition = [...linePoints].pop() || {};
        if (lastPosition.x && lastPosition.y && currentMousePosition.x && currentMousePosition.y) {
            context.beginPath();
            context.moveTo(lastPosition.x, lastPosition.y);
            context.lineTo(currentMousePosition.x, currentMousePosition.y);
            context.stroke();
        }
    }, [positions, ref.current, currentMousePosition, linePoints]);

    const handleClick = useCallback(() => {
        const points = [
            ...linePoints,
            currentMousePosition
        ];

        if (points.length === 2) {
            setPositions([
                ...positions,
                points
            ])
            setLinePoints([currentMousePosition]);
        } else {
            setLinePoints(points);
        }
    }, [positions, currentMousePosition, linePoints]);

    const handleMouseMove = useCallback((event) => {
        const position = {
            x: event.clientX,
            y: event.clientY,
        };

        const pastPositions = [
            ...polylines.flat(),
            ...positions.slice(0, -1)
        ];

        let shortDistances =[];
        if (pastPositions.length) {
            const distances = [];
            pastPositions.forEach((pos) => {
                distances.push({
                    line: pos,
                    ...distToSegment(position, pos[0], pos[1]),
                });
            });

            shortDistances = distances.filter((distance) => {
                return distance.distance < snapDistance;
            });
        }

        const newSnapPosition = shortDistances.sort((a, b) => b.distance - a.distance);
        if (newSnapPosition.length) {
            setCurrentMousePosition({
                x: newSnapPosition[0].x,
                y: newSnapPosition[0].y,
            });
        } else {
            setCurrentMousePosition(position);
        }
    }, [polylines, positions]);

    return (
        <div>
            <canvas
                ref={ref}
                width={window.innerWidth}
                height={window.innerHeight}
                style={{
                    backgroundColor: '#ddd',
                }}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
            />
            <button onClick={() => console.log({ polylines, positions })} >clicky</button>
        </div>
    );
}

export default App;
