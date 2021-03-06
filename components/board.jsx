/* eslint-disable jsx-a11y/mouse-events-have-key-events */
import React, { useState, useEffect } from 'react';
import * as _ from 'lodash';
import Head from 'next/head';
import Node from './node';
import Dijkstra from '../algorithms/dijkstra';
import BFS from '../algorithms/BFS';
import DFS from '../algorithms/DFS';
import AStar from '../algorithms/AStar';
import ButtonBar from './buttonbar';

const [ROWS, COLS] = [30, 40];
let [START_ROW, START_COL] = [15, 2];
let [FINISH_ROW, FINISH_COL] = [15, 37];

const getNode = (row, col, wall = false) => ({
  row,
  col,
  isStart: row === START_ROW && col === START_COL,
  isFinish: row === FINISH_ROW && col === FINISH_COL,
  isVisited: false,
  isWall: wall,
  distance: Infinity,
  previousNode: null,
});

const getGrid = (walls = null) => {
  const grid = [];
  _.each(new Array(ROWS), (_row, rowIndex) => {
    const currentRow = [];
    _.each(new Array(COLS), (_col, colIndex) => {
      // eslint-disable-next-line max-len
      currentRow.push(getNode(rowIndex, colIndex, walls ? walls[rowIndex][colIndex].isWall : false));
    });
    grid.push(currentRow);
  });

  return grid;
};

const toggleWall = (grid, row, col) => {
  const newGrid = _.clone(grid);
  const node = newGrid[row][col];
  if (!(node.isStart || node.isFinish)) {
    const newNode = _.assign(node, { isWall: !node.isWall });
    newGrid[row][col] = newNode;
  }
  return newGrid;
};

const Board = () => {
  const [nodes, setNodes] = useState(0);
  const [mousePressed, setMousePressed] = useState(false);

  const handleMouseDown = (row, col) => {
    setMousePressed(true);
    setNodes(toggleWall(nodes, row, col));
  };

  const handleMouseEnter = (row, col) => {
    if (!mousePressed) return;
    setNodes(toggleWall(nodes, row, col));
  };

  const handleMouseUp = () => {
    setMousePressed(false);
  };

  const reset = (resetWall = false) => {
    if (resetWall) {
      setNodes(getGrid());
      return;
    }
    setNodes(getGrid(nodes));
    _.each(_.flatten(nodes), (node) => {
      nodes.isVisited = false;
      const element = document.getElementById(`node-${node.row}-${node.col}`);
      if (element) {
        element.className = _.replace(element.className, /visited/i, '');
        element.className = _.replace(element.className, /path/i, '');
      }
    });
  };

  const handleEndNodes = (row, col, startDragged = false) => {
    if (startDragged) {
      START_ROW = row;
      START_COL = col;
    } else {
      FINISH_ROW = row;
      FINISH_COL = col;
    }
    reset();
  };

  const getShortestPath = (finishNode) => {
    const array = [];
    let currentNode = finishNode;
    while (currentNode) {
      array.push(currentNode);
      currentNode = currentNode.previousNode;
    }
    return array.reverse();
  };

  const animateAlgorithm = (visitedNodes, shortestPathNodes) => {
    _.each(visitedNodes, (node, i) => {
      if ((node.row === START_ROW && node.col === START_COL)
        || (node.row === FINISH_ROW && node.col === FINISH_COL)) return;
      _.delay(() => {
        document.getElementById(`node-${node.row}-${node.col}`).className += ' visited';
      }, 20 * i);
    });

    _.each(shortestPathNodes, (node, j) => {
      if ((node.row === START_ROW && node.col === START_COL)
        || (node.row === FINISH_ROW && node.col === FINISH_COL)) return;
      _.delay(() => {
        document.getElementById(`node-${node.row}-${node.col}`).className += ' path';
      }, visitedNodes.length * 20 + 30 * j);
    });
  };

  const visualizeAlgorithm = (type) => {
    const startNode = nodes[START_ROW][START_COL];
    const endNode = nodes[FINISH_ROW][FINISH_COL];
    let visitedNodes = [];
    switch (type) {
      case 0: visitedNodes = Dijkstra(nodes, startNode, endNode); break;
      default:
      case 1: visitedNodes = BFS(nodes, startNode, endNode); break;
      case 2: visitedNodes = DFS(nodes, startNode, endNode); break;
      case 3: visitedNodes = AStar(nodes, startNode, endNode); break;
    }
    const shortestPathNodes = getShortestPath(endNode);
    animateAlgorithm(visitedNodes, shortestPathNodes);
  };

  const generateMaze = () => {
    reset();
    const grid = [];
    _.each(new Array(ROWS), (_row, rowIndex) => {
      const currentRow = [];
      _.each(new Array(COLS), (_col, colIndex) => {
        let randomness = !!_.round(Math.random() ** 2);
        if ((rowIndex === FINISH_ROW && colIndex === FINISH_COL)
          || (rowIndex === START_ROW && colIndex === START_COL)) {
          randomness = false;
        }
        currentRow.push(getNode(rowIndex, colIndex, randomness));
      });
      grid.push(currentRow);
    });

    setNodes(grid);
  };

  useEffect(() => {
    setNodes(getGrid());
    generateMaze();
  }, []);

  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <center>
        <ButtonBar
          visualizeAlgorithm={visualizeAlgorithm}
          reset={reset}
          generateMaze={generateMaze}
        />
        <div
          className="board"
          onMouseLeave={() => setMousePressed(false)}
        >
          {_.map(nodes, (row, rowIdx) => (
            <div key={rowIdx}>
              {_.map(row, (node, nodeIdx) => (
                <Node
                  key={`${nodeIdx}~~${rowIdx}`}
                  node={node}
                  draggable={(node.row === START_ROW && node.col === START_COL)
                      || (node.row === FINISH_ROW && node.col === FINISH_COL)}
                  onMouseDown={(_row, col) => handleMouseDown(_row, col)}
                  onMouseEnter={(_row, col) => handleMouseEnter(_row, col)}
                  onMouseUp={() => handleMouseUp()}
                  setEndNodes={handleEndNodes}
                />
              ))}
            </div>
          ))}
        </div>
      </center>

      <style jsx>
        {`
        div{
          line-height: 0;
        }
        body{
          background-color: black;
        }
        .board {
          margin: 0;
          padding: 12px 0 0;
          font-size: 13px;
          color: #333;
        }
      `}
      </style>
    </div>
  );
};

export default Board;
