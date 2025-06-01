import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TicTacToe from './TicTacToe';

describe('TicTacToe Component', () => {
  // Helper function to get all square buttons
  const getSquares = () => screen.getAllByRole('button', { name: /^[XO]$|^$/i });
  // Helper function to get the reset button (name can vary based on implementation)
  const getResetButton = () => screen.getByRole('button', { name: /reset game/i });
  // Helper function to get the status display
  const getStatus = () => screen.getByText(/Next player:|Winner:|It's a draw!/i);

  test('initial render: displays 9 cells, initial status, and reset button', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    expect(squares).toHaveLength(9);
    squares.forEach(square => expect(square).toHaveTextContent(''));
    expect(getStatus()).toHaveTextContent('Next player: X');
    expect(getResetButton()).toBeInTheDocument();
  });

  test('making a move: updates cell and status', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]);
    expect(squares[0]).toHaveTextContent('X');
    expect(getStatus()).toHaveTextContent('Next player: O');
  });

  test('alternating turns: X and O take turns correctly', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]); // X
    expect(squares[0]).toHaveTextContent('X');
    expect(getStatus()).toHaveTextContent('Next player: O');
    fireEvent.click(squares[1]); // O
    expect(squares[1]).toHaveTextContent('O');
    expect(getStatus()).toHaveTextContent('Next player: X');
    fireEvent.click(squares[2]); // X
    expect(squares[2]).toHaveTextContent('X');
    expect(getStatus()).toHaveTextContent('Next player: O');
  });

  test('preventing moves on filled cells', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]); // X's turn, clicks cell 0
    expect(squares[0]).toHaveTextContent('X');
    expect(getStatus()).toHaveTextContent('Next player: O');

    fireEvent.click(squares[0]); // O's turn, clicks cell 0 again (should not change)
    expect(squares[0]).toHaveTextContent('X'); // Still X
    expect(getStatus()).toHaveTextContent('Next player: O'); // Still O's turn
  });

  test('win condition: X wins', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    // X O X
    // O X O
    // X - -
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[3]); // O
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[2]); // X wins on top row

    expect(getStatus()).toHaveTextContent('Winner: X');
    // Check if squares are disabled (or click doesn't change)
    fireEvent.click(squares[5]); // Try clicking another cell
    expect(squares[5]).toHaveTextContent(''); // Should remain empty
    expect(squares[5]).toBeDisabled();
  });

  test('win condition: O wins', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    // X X O
    // X O -
    // O - -
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[2]); // O
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[3]); // X
    fireEvent.click(squares[6]); // O wins on left column

    expect(getStatus()).toHaveTextContent('Winner: O');
    fireEvent.click(squares[5]);
    expect(squares[5]).toHaveTextContent('');
    expect(squares[5]).toBeDisabled();
  });

  test('draw condition', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    // X O X
    // X O X
    // O X O
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[2]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[3]); // X
    fireEvent.click(squares[5]); // O
    fireEvent.click(squares[7]); // X
    fireEvent.click(squares[6]); // O
    fireEvent.click(squares[8]); // X - Draw

    expect(getStatus()).toHaveTextContent("It's a draw!");
    fireEvent.click(squares[0]); // Try clicking a filled cell
    expect(squares[0]).toHaveTextContent('X'); // Should not change
    expect(squares[0]).toBeDisabled(); // All should be disabled
  });

  test('resetting the game after a win', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[3]); // O
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[2]); // X wins
    expect(getStatus()).toHaveTextContent('Winner: X');

    fireEvent.click(getResetButton());

    expect(getStatus()).toHaveTextContent('Next player: X');
    squares.forEach(square => {
      expect(square).toHaveTextContent('');
      expect(square).not.toBeDisabled();
    });

    // Verify game can be played again
    fireEvent.click(squares[0]);
    expect(squares[0]).toHaveTextContent('X');
    expect(getStatus()).toHaveTextContent('Next player: O');
  });

  test('resetting the game after a draw', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    // Draw sequence
    fireEvent.click(squares[0]); fireEvent.click(squares[1]); fireEvent.click(squares[2]);
    fireEvent.click(squares[3]); fireEvent.click(squares[5]); fireEvent.click(squares[4]);
    fireEvent.click(squares[6]); fireEvent.click(squares[8]); fireEvent.click(squares[7]);
    // This sequence leads to a draw based on common implementations
    // X O X
    // O X O
    // X X O -> Draw if calculateWinner checks board fullness after win lines
    // Let's adjust the draw test sequence to be more robust or use the one from above
    // Using the confirmed draw sequence:
    // X O X
    // X O X
    // O X O
    // Re-doing clicks for clarity for this test:
    fireEvent.click(getSquares()[0]); // X
    fireEvent.click(getSquares()[1]); // O
    fireEvent.click(getSquares()[2]); // X
    fireEvent.click(getSquares()[4]); // O
    fireEvent.click(getSquares()[3]); // X
    fireEvent.click(getSquares()[5]); // O
    fireEvent.click(getSquares()[7]); // X
    fireEvent.click(getSquares()[6]); // O
    fireEvent.click(getSquares()[8]); // X - Draw

    expect(getStatus()).toHaveTextContent("It's a draw!");

    fireEvent.click(getResetButton());

    expect(getStatus()).toHaveTextContent('Next player: X');
    getSquares().forEach(square => {
      expect(square).toHaveTextContent('');
      expect(square).not.toBeDisabled();
    });
    // Verify game can be played again
    fireEvent.click(getSquares()[0]);
    expect(getSquares()[0]).toHaveTextContent('X');
  });
});
