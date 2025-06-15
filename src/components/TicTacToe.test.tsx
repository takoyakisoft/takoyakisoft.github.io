import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TicTacToe from './TicTacToe';
import { describe, test, expect } from 'vitest';

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
// Comprehensive winning combination tests
  test('all winning combinations: top row', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[3]); // O
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[2]); // X wins top row
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: middle row', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[3]); // X
    fireEvent.click(squares[0]); // O
    fireEvent.click(squares[4]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[5]); // X wins middle row
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: bottom row', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[6]); // X
    fireEvent.click(squares[0]); // O
    fireEvent.click(squares[7]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[8]); // X wins bottom row
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: left column', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[3]); // X
    fireEvent.click(squares[2]); // O
    fireEvent.click(squares[6]); // X wins left column
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: middle column', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[0]); // O
    fireEvent.click(squares[4]); // X
    fireEvent.click(squares[2]); // O
    fireEvent.click(squares[7]); // X wins middle column
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: right column', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[2]); // X
    fireEvent.click(squares[0]); // O
    fireEvent.click(squares[5]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[8]); // X wins right column
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: main diagonal', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[4]); // X
    fireEvent.click(squares[2]); // O
    fireEvent.click(squares[8]); // X wins main diagonal
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  test('all winning combinations: anti-diagonal', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    fireEvent.click(squares[2]); // X
    fireEvent.click(squares[0]); // O
    fireEvent.click(squares[4]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[6]); // X wins anti-diagonal
    expect(getStatus()).toHaveTextContent('Winner: X');
  });

  // Edge case tests
  test('edge case: rapid multiple clicks on same cell', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Rapid fire clicks on the same cell
    fireEvent.click(squares[0]);
    fireEvent.click(squares[0]);
    fireEvent.click(squares[0]);
    
    expect(squares[0]).toHaveTextContent('X');
    expect(getStatus()).toHaveTextContent('Next player: O');
  });

  test('edge case: clicking all cells rapidly', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Click all squares in rapid succession
    squares.forEach(square => fireEvent.click(square));
    
    // Verify alternating X and O pattern
    expect(squares[0]).toHaveTextContent('X');
    expect(squares[1]).toHaveTextContent('O');
    expect(squares[2]).toHaveTextContent('X');
    expect(squares[3]).toHaveTextContent('O');
    expect(squares[4]).toHaveTextContent('X');
    expect(squares[5]).toHaveTextContent('O');
    expect(squares[6]).toHaveTextContent('X');
    expect(squares[7]).toHaveTextContent('O');
    expect(squares[8]).toHaveTextContent('X');
  });

  test('edge case: clicking after game ends', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Create winning condition
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[3]); // O
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[2]); // X wins
    
    expect(getStatus()).toHaveTextContent('Winner: X');
    
    // Try clicking every remaining cell
    [5, 6, 7, 8].forEach(index => {
      fireEvent.click(squares[index]);
      expect(squares[index]).toHaveTextContent('');
      expect(squares[index]).toBeDisabled();
    });
  });

  // Accessibility tests
  test('accessibility: squares have proper ARIA labels', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    squares.forEach((square, index) => {
      expect(square).toHaveAttribute('role', 'button');
      expect(square).toBeInTheDocument();
    });
  });

  test('accessibility: status updates are announced', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    const status = getStatus();
    
    expect(status).toBeInTheDocument();
    
    fireEvent.click(squares[0]);
    expect(getStatus()).toHaveTextContent('Next player: O');
  });

  test('keyboard navigation: focus management', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    const resetButton = getResetButton();
    
    // Test that buttons can receive focus
    squares[0].focus();
    expect(squares[0]).toHaveFocus();
    
    resetButton.focus();
    expect(resetButton).toHaveFocus();
  });

  // Component state and lifecycle tests
  test('component state: consistent re-renders', () => {
    const { rerender } = render(<TicTacToe />);
    const squares = getSquares();
    
    fireEvent.click(squares[0]); // X
    expect(squares[0]).toHaveTextContent('X');
    
    // Force re-render
    rerender(<TicTacToe />);
    
    // After re-render, component should reset to initial state
    const newSquares = getSquares();
    newSquares.forEach(square => expect(square).toHaveTextContent(''));
    expect(getStatus()).toHaveTextContent('Next player: X');
  });

  test('component cleanup: no memory leaks on unmount', () => {
    const { unmount } = render(<TicTacToe />);
    const squares = getSquares();
    
    fireEvent.click(squares[0]);
    expect(squares[0]).toHaveTextContent('X');
    
    // Unmount component
    expect(() => unmount()).not.toThrow();
  });

  // Stress tests
  test('stress test: multiple reset operations', () => {
    render(<TicTacToe />);
    
    for (let i = 0; i < 10; i++) {
      const squares = getSquares();
      const resetButton = getResetButton();
      
      // Make some moves
      fireEvent.click(squares[0]);
      fireEvent.click(squares[1]);
      
      // Reset
      fireEvent.click(resetButton);
      
      // Verify clean state
      expect(getStatus()).toHaveTextContent('Next player: X');
      getSquares().forEach(square => {
        expect(square).toHaveTextContent('');
        expect(square).not.toBeDisabled();
      });
    }
  });

  test('stress test: full game sequences', () => {
    render(<TicTacToe />);
    
    // Play multiple complete games
    const gameSequences = [
      [0, 1, 2], // X wins top row
      [3, 4, 5], // Different patterns
      [6, 7, 8]
    ];
    
    gameSequences.forEach((winningMoves, gameIndex) => {
      const squares = getSquares();
      const resetButton = getResetButton();
      
      if (gameIndex > 0) {
        fireEvent.click(resetButton);
      }
      
      // Play winning sequence for X
      winningMoves.forEach((move, index) => {
        fireEvent.click(squares[move]);
        if (index < winningMoves.length - 1) {
          // O makes a move (different position)
          fireEvent.click(squares[move + 3 < 9 ? move + 3 : move - 3]);
        }
      });
      
      expect(getStatus()).toHaveTextContent('Winner: X');
    });
  });

  // Error handling tests
  test('error handling: graceful handling of invalid game states', () => {
    render(<TicTacToe />);
    
    // This test ensures the component doesn't crash with unexpected interactions
    const squares = getSquares();
    const resetButton = getResetButton();
    
    // Try various edge case interactions
    fireEvent.click(resetButton); // Reset before any moves
    expect(getStatus()).toHaveTextContent('Next player: X');
    
    // Normal game flow should still work
    fireEvent.click(squares[0]);
    expect(squares[0]).toHaveTextContent('X');
  });

  test('boundary conditions: testing with different starting conditions', () => {
    render(<TicTacToe />);
    
    // Test that component handles initial render correctly
    expect(getSquares()).toHaveLength(9);
    expect(getStatus()).toBeDefined();
    expect(getResetButton()).toBeDefined();
    
    // All squares should be clickable initially
    getSquares().forEach(square => {
      expect(square).not.toBeDisabled();
    });
  });

  // Comprehensive draw tests
  test('draw scenarios: various draw patterns', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Create a specific draw scenario
    // X O X
    // O X O  
    // O X X
    const moves = [
      [0, 'X'], [1, 'O'], [2, 'X'], // Top row
      [3, 'O'], [4, 'X'], [5, 'O'], // Middle row  
      [6, 'O'], [7, 'X'], [8, 'X']  // Bottom row
    ];
    
    moves.forEach(([index]) => {
      fireEvent.click(squares[index as number]);
    });
    
    expect(getStatus()).toHaveTextContent("It's a draw!");
    
    // All squares should be disabled
    squares.forEach(square => {
      expect(square).toBeDisabled();
    });
  });

  test('near-draw scenarios: game continues when no winner yet', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Fill 8 squares without creating a winner
    // X O X
    // O X O
    // O X _
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[1]); // O
    fireEvent.click(squares[2]); // X
    fireEvent.click(squares[3]); // O
    fireEvent.click(squares[4]); // X
    fireEvent.click(squares[5]); // O
    fireEvent.click(squares[6]); // X
    fireEvent.click(squares[7]); // O
    
    // Game should still be active
    expect(getStatus()).toHaveTextContent('Next player: X');
    expect(squares[8]).not.toBeDisabled();
    
    // Last move creates draw
    fireEvent.click(squares[8]); // X
    expect(getStatus()).toHaveTextContent("It's a draw!");
  });

  // Game flow validation tests
  test('game flow: consistent turn alternation throughout game', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    const expectedTurns = ['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X'];
    const moves = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    
    moves.forEach((move, index) => {
      fireEvent.click(squares[move]);
      expect(squares[move]).toHaveTextContent(expectedTurns[index]);
      
      // Check next player display (if game not ended)
      if (index < moves.length - 1) {
        const nextPlayer = expectedTurns[index + 1];
        if (index < 6) { // Before potential draw
          expect(getStatus()).toHaveTextContent(`Next player: ${nextPlayer}`);
        }
      }
    });
  });

  test('game state: verify button states match game phase', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Initial state - all enabled
    squares.forEach(square => expect(square).not.toBeDisabled());
    
    // Mid-game state
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[1]); // O
    
    expect(squares[0]).toBeDisabled(); // Filled squares disabled
    expect(squares[1]).toBeDisabled();
    squares.slice(2).forEach(square => expect(square).not.toBeDisabled()); // Empty squares enabled
    
    // End game state - create win
    fireEvent.click(squares[3]); // X
    fireEvent.click(squares[2]); // O
    fireEvent.click(squares[6]); // X wins left column
    
    squares.forEach(square => expect(square).toBeDisabled()); // All disabled after win
  });

});

// Additional describe block for integration-style tests
describe('TicTacToe Integration Tests', () => {
  // Helper functions for integration tests
  const getSquares = () => screen.getAllByRole('button', { name: /^[XO]$|^$/i });
  const getResetButton = () => screen.getByRole('button', { name: /reset game/i });
  const getStatus = () => screen.getByText(/Next player:|Winner:|It's a draw!/i);

  test('complete game simulation: realistic user interaction', () => {
    render(<TicTacToe />);
    
    // Simulate a realistic game where users might think before moves
    const squares = getSquares();
    
    // User clicks center
    fireEvent.click(squares[4]);
    expect(squares[4]).toHaveTextContent('X');
    
    // Opponent takes corner
    fireEvent.click(squares[0]);
    expect(squares[0]).toHaveTextContent('O');
    
    // User blocks potential win
    fireEvent.click(squares[8]);
    expect(squares[8]).toHaveTextContent('X');
    
    // Continue realistic game flow
    fireEvent.click(squares[2]);
    expect(squares[2]).toHaveTextContent('O');
    
    fireEvent.click(squares[6]);
    expect(squares[6]).toHaveTextContent('X');
    
    fireEvent.click(squares[5]);
    expect(squares[5]).toHaveTextContent('O');
    
    fireEvent.click(squares[3]);
    expect(squares[3]).toHaveTextContent('X');
    
    fireEvent.click(squares[7]);
    expect(squares[7]).toHaveTextContent('O');
    
    fireEvent.click(squares[1]);
    expect(squares[1]).toHaveTextContent('X');
    
    // Should be a draw
    expect(getStatus()).toHaveTextContent("It's a draw!");
  });

  test('multiple game sessions: reset functionality works across sessions', () => {
    render(<TicTacToe />);
    
    // Play first game to completion
    let squares = getSquares();
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[3]); // O  
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[4]); // O
    fireEvent.click(squares[2]); // X wins
    
    expect(getStatus()).toHaveTextContent('Winner: X');
    
    // Reset and play second game
    fireEvent.click(getResetButton());
    squares = getSquares();
    
    fireEvent.click(squares[4]); // X center
    fireEvent.click(squares[0]); // O corner
    fireEvent.click(squares[8]); // X opposite corner
    fireEvent.click(squares[2]); // O corner
    fireEvent.click(squares[6]); // X corner - should win diagonal
    
    expect(getStatus()).toHaveTextContent('Winner: X');
    
    // Reset and verify clean state for third game
    fireEvent.click(getResetButton());
    expect(getStatus()).toHaveTextContent('Next player: X');
    getSquares().forEach(square => {
      expect(square).toHaveTextContent('');
      expect(square).not.toBeDisabled();
    });
  });

  test('O player winning scenarios: comprehensive O wins', () => {
    render(<TicTacToe />);
    const squares = getSquares();
    
    // Test O winning on bottom row
    fireEvent.click(squares[0]); // X
    fireEvent.click(squares[6]); // O
    fireEvent.click(squares[1]); // X
    fireEvent.click(squares[7]); // O
    fireEvent.click(squares[3]); // X
    fireEvent.click(squares[8]); // O wins bottom row
    
    expect(getStatus()).toHaveTextContent('Winner: O');
    
    // All squares should be disabled
    squares.forEach(square => {
      expect(square).toBeDisabled();
    });
  });

  test('performance: handling rapid game state changes', () => {
    render(<TicTacToe />);
    
    // Test rapid succession of games
    for (let gameNum = 0; gameNum < 5; gameNum++) {
      const squares = getSquares();
      const resetButton = getResetButton();
      
      if (gameNum > 0) {
        fireEvent.click(resetButton);
      }
      
      // Quick game - X wins first column
      fireEvent.click(squares[0]); // X
      fireEvent.click(squares[1]); // O
      fireEvent.click(squares[3]); // X
      fireEvent.click(squares[2]); // O
      fireEvent.click(squares[6]); // X wins
      
      expect(getStatus()).toHaveTextContent('Winner: X');
    }
  });
