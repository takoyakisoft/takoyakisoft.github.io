import React from 'react';
import { Link } from 'react-router-dom';
import TicTacToe from '../components/TicTacToe';
import styles from './ToolPage.module.css';

const TicTacToePage: React.FC = () => {
  return (
    <div className={styles.toolPageContainer}>
      <h1>Tic-Tac-Toe Game</h1>
      <TicTacToe />
      <div className={styles.backLinkContainer}>
        <Link to="/" className={styles.backLink}>
          ホームページに戻る
        </Link>
      </div>
    </div>
  );
};

export default TicTacToePage;
