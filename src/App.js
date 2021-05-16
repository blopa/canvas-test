import { useCallback, useState, useRef } from 'react';
import useAnimationFrame from 'use-animation-frame';
import useEventListener from '@use-it/event-listener';

// Styles
import './App.css';

function sqr(x) {
    return x * x;
}

function dist2(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function distToSegmentSquared(p, v, w) {
    const l2 = dist2(v, w);
    if (l2 == 0) {
        return dist2(p, v);
    }

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

function distToSegment(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
}

function App() {
    const [currentMousePosition, setCurrentMousePosition] = useState({});
    const [linePoints, setLinePoints] = useState([]);
    const [positions, setPositions] = useState([]);
    const [polylines, setPolylines] = useState([]);
    const ref = useRef(null);

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
        if (lastPosition.x && lastPosition.y && currentMousePosition?.x && currentMousePosition?.y) {
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

        // if (positions.length || polylines.length) {
        //     [
        //         ...polylines.flat(),
        //         ...positions,
        //     ].forEach((pos) => {
        //         const distance = distToSegment(position, pos[0], pos[1]);
        //         debugger;
        //     });
        // }

        setCurrentMousePosition(position);
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
