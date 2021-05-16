import { useCallback, useState, useRef } from 'react';
import useAnimationFrame from 'use-animation-frame';
import useEventListener from '@use-it/event-listener';

// Styles
import './App.css';

function App() {
    const [currentMousePosition, setCurrentMousePosition] = useState({});
    const [positions, setPositions] = useState([]);
    const [polylines, setPolylines] = useState([]);
    const ref = useRef(null);

    useEventListener('keydown', (event) => {
        if (event.keyCode === 27){
            setPolylines([
                ...polylines,
                positions,
            ]);
            setPositions([]);
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
            for (let i = 1; i < loopPositions.length; i++) {
                context.beginPath();
                context.moveTo(loopPositions[i - 1].x, loopPositions[i - 1].y);
                context.lineTo(loopPositions[i].x, loopPositions[i].y);
                context.stroke();
            }
        }

        polylines.forEach(drawLines);
        drawLines(positions);

        if (positions.length && currentMousePosition?.x && currentMousePosition?.y) {
            const lastPosition = positions[positions.length - 1];
            context.beginPath();
            context.moveTo(lastPosition.x, lastPosition.y);
            context.lineTo(currentMousePosition.x, currentMousePosition.y);
            context.stroke();
        }
    }, [positions, ref.current, currentMousePosition]);

    const handleClick = useCallback((event) => {
        setPositions([
            ...positions,
            {x: event.clientX, y: event.clientY}
        ]);
    }, [positions]);

    const handleMouseMove = useCallback((event) => {
        setCurrentMousePosition({x: event.clientX, y: event.clientY});
    }, []);

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
            <button onClick={() => console.log(positions)} >clicky</button>
        </div>
    );
}

export default App;
