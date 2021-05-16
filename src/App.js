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
    // set mouse position - could use a debounce to improve performance
    const [currentMousePosition, setCurrentMousePosition] = useState({});

    // set the last formed line points
    const [linePoints, setLinePoints] = useState([]);

    // set all "unfinished" positions (no esc pressed)
    const [positions, setPositions] = useState([]);

    // set all the "saved" positions
    const [polylines, setPolylines] = useState([]);

    // reference for the canvas
    const ref = useRef(null);

    // distance to trigger the snap
    const snapDistance = 30;

    // listener for the esc key
    // since we already have all the state in a hook variable
    // we can easily implement control + z feature
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

    // let's update the canvas on every animation frame update
    // we need this to re-draw the line preview that follows the mouse point
    useAnimationFrame(() => {
        if (!ref.current) {
            return;
        }

        const canvas = ref.current;
        const context = canvas.getContext('2d');

        // clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // helper function to draw the lines on the canvas
        const drawLines = (loopPositions) => {
            context.beginPath();
            context.moveTo(loopPositions[0].x, loopPositions[0].y);
            context.lineTo(loopPositions[1].x, loopPositions[1].y);
            context.stroke();
        }

        // draw lines for all saved positions
        polylines.forEach((polyline) => {
            polyline.forEach(drawLines);
        });

        // draw lines for all un-saved positions
        positions.forEach(drawLines);

        // draw line for the preview
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
        // if we have some positions set, then let's try to find
        // the nearest position within the "snapDistance" range
        // this can be heavily improved I fear
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

        // get the closest one
        const newSnapPosition = shortDistances.sort((a, b) => b.distance - a.distance);
        if (newSnapPosition.length) {
            setCurrentMousePosition({
                x: newSnapPosition[0].x,
                y: newSnapPosition[0].y,
            });
        } else {
            // if we don't have it, just set to the current mouse position
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
            <button onClick={() => console.log({
                currentMousePosition,
                linePoints,
                positions,
                polylines,
            })} >clicky</button>
        </div>
    );
}

export default App;
