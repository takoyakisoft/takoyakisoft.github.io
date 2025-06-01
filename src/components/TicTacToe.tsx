import React, { useState } from 'react';
import styles from './TicTacToe.module.css';

type Player = 'X' | 'O';
type SquareValue = Player | null;

const calculateWinner = (squares: SquareValue[]): SquareValue | 'Draw' => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  if (squares.every(square => square !== null)) {
    return 'Draw';
  }
  return null;
};

const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<SquareValue | 'Draw'>(null);

  const handleClick = (index: number) => {
    if (board[index] || winner) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  };

  const renderSquare = (index: number) => {
    return (
      <button
        className={styles.square}
        onClick={() => handleClick(index)}
        disabled={!!winner || !!board[index]}
      >
        {board[index]}
      </button>
    );
  };

  let status;
  if (winner) {
    status = winner === 'Draw' ? "It's a draw!" : `Winner: ${winner}`;
  } else {
    status = `Next player: ${currentPlayer}`;
  }

  return (
    <div className={styles.ticTacToe}>
      <div className={styles.status}>{status}</div>
      <div className={styles.board}>
        {Array(3)
          .fill(null)
          .map((_, rowIndex) => (
            <div key={rowIndex} className={styles.boardRow}>
              {Array(3)
                .fill(null)
                .map((_, colIndex) => renderSquare(rowIndex * 3 + colIndex))}
            </div>
          ))}
      </div>
      <button className={styles.resetButton} onClick={resetGame}>
        Reset Game
      </button>
    </div>
  );
};

export default TicTacToe;
