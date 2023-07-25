import {Chess} from 'chess.js'
import Chessboard from 'chessboardjsx'
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import React, {useState, useEffect} from 'react'

// import { addFEN } from "../../Redux/Action/FEN_Actions";
// import { addSAN } from '../../Redux/Action/SAN_Actions';
import OutcomeModal from '../portals/OutcomeModal';
import "./style.css"
import { RESULT } from '../inGameView/InGameView';
import { useLocation } from 'react-router-dom';
// import { addPGN } from '../../Redux/Action/PGN_Actions';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import MessageModal from '../portals/MessageModal';

// Source: https://www.i2symbol.com/symbols/chess
export const WHITE_CHESS_PIECE = {
  KING: "♔",
  QUEEN: "♕",
  BISHOP: "♗",
  KNIGHT: "♘",
  ROOK: "♖",
  PAWN: "♙",
};

// Source: https://www.i2symbol.com/symbols/chess
export const BLACK_CHESS_PIECE = {
  KING: "♚",
  QUEEN: "♛",
  BISHOP: "♝",
  KNIGHT: "♞",
  ROOK: "♜",
  PAWN: "♟",
};

const chess = new Chess();

export default function ChessboardGame({socket, setSocket, roomId, isGameStarted, setIsGameStarted, isModalOpen, setIsModalOpen, setResult, activePlayer, setActivePlayer}) {
    // const FENList = useSelector((storeState) => storeState.FENReducer.FEN)
    // const SANList = useSelector((storeState) => storeState.SANReducer.SAN)
    // const PGNList = useSelector((storeState) => storeState.PGNReducer.PGN)
    
    //Source: https://chat.openai.com/share/046ed508-1fa5-43d7-94ac-87e8cb9675e4
    const PGNList = useSelector((storeState) => JSON.parse(storeState.PGNReducer.PGNOBJ))
    
    
    const dispatch = useDispatch()
    const location = useLocation();
    const [blackPlayerName, setBlackPlayerName] = useState("")
    const [whitePlayerName, setWhitePlayerName] = useState("")

    const [fen, setFen] = useState(PGNList.prevMoveListFEN[PGNList.prevMoveListFEN.length - 1]);
    const [history, setHistory] = useState([]);
    const [header, setHeader] = useState(chess.header("White", whitePlayerName, "Black", blackPlayerName));
    const [halfMove, setHalfMove] = useState(0);
    const [fullMove, setFullMove] = useState(1);
    const [whitePlayerTimer, setWhitePlayerTimer] = useState(300);
    const [blackPlayerTimer, setBlackPlayerTimer] = useState(300);
    const [whitePawnPromotionChoice, setWhitePawnPromotionChoice] = useState(WHITE_CHESS_PIECE.QUEEN)
    const [blackPawnPromotionChoice, setBlackPawnPromotionChoice] = useState(BLACK_CHESS_PIECE.QUEEN)
    const [sqaureStyles, setSqaureStyles] = useState()
    const [players, setPlayers] = useState([]);

    const [legalPieceMoves, setLegalPieceMoves] = useState();

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)

    const [orientation, setOrientation] = useState('white')

    const [isCheckmate, setIsCheckmate] = useState(false);

    const navigate = useNavigate();

    function onMouseOverSquare(square) {
      // setMouseOverSquare(square);
      if (socket) {
        socket.emit('valid move', roomId, square);
      }
    }

    function onSquareClick(square) {

      let currentPlayer = null;

      // if (currentPlayer) {
        for (let i = 0; i < players.length; i++) {
          if (socket.id === players[i].id) {
            currentPlayer = players[i]
            break
          }
        }
        console.log("line 97", players);
        console.log("line 90", currentPlayer);
        console.log("line 91", activePlayer);

        if (activePlayer === currentPlayer.color[0]) {

          const validMovesIncludingSelf = chess.moves({square: square, verbose: true})

        let validMovesExclusingSelf = []
        
        
        
        for (let i = 0; i < validMovesIncludingSelf.length; i++) {
          
          validMovesExclusingSelf.push(validMovesIncludingSelf[i]['to'])
        }
    
        // Source: https://chat.openai.com/share/e9c789ed-ad8d-4843-9a37-51a772293ddc
        const styles = {}
        const self = String(square);
        if (validMovesExclusingSelf.length > 0) {
          styles[self] = {backgroundColor: "#bbcb2b"}
        }
        for (let i = 0; i < validMovesExclusingSelf.length; i++) {
          const property = String(validMovesExclusingSelf[i])
          // Source: https://codesandbox.io/s/x332zqpkl4?from-embed=&file=/src/integrations/WithMoveValidation.js:1229-1284
          styles[property] = {background: "radial-gradient(circle, #d6d6bd 36%, transparent 40%)"}
        }

        console.log("line 114", validMovesExclusingSelf);
        
        setSqaureStyles(styles);
      }
    // }
    }

    function onDrop({sourceSquare, targetSquare}) {
      
      if (socket) {
        console.log("line 134");
        
        const validMoves = chess.moves({square: sourceSquare, verbose: true})

        console.log("line 139", validMoves);

        let result = "";
        for (let i = 0; i < validMoves.length; i++) {
          if (validMoves[i]['to'] === targetSquare) {
            result = validMoves[i]['san']
            break;
          }
        }
        console.log("line 142");
        // socket.emit('move', roomId, result, sourceSquare);
        
        if (result !== "" && sourceSquare !== targetSquare) {
          // socket.emit('move', roomId, result)
          console.log("line 144");
          socket.emit('move', roomId, result);
          socket.emit('history', roomId)
          socket.emit('pgn', roomId)
        }
        setSqaureStyles('');
      }

      // let move = null;
      // let promotionChoice = 'q';
      // if (chess.turn() === "w") {
      //   if(whitePawnPromotionChoice === WHITE_CHESS_PIECE.ROOK) {
      //     promotionChoice = 'r'
      //   } else if (whitePawnPromotionChoice === WHITE_CHESS_PIECE.KNIGHT) {
      //     promotionChoice = 'n'
      //   } else if (whitePawnPromotionChoice === WHITE_CHESS_PIECE.BISHOP) {
      //     promotionChoice = 'b'
      //   } else if (whitePawnPromotionChoice === WHITE_CHESS_PIECE.QUEEN) {
      //     promotionChoice = 'q'
      //   }
      // } else if (chess.turn() === 'b') {
      //   if(blackPawnPromotionChoice === BLACK_CHESS_PIECE.ROOK) {
      //     promotionChoice = 'r'
      //   } else if (blackPawnPromotionChoice === BLACK_CHESS_PIECE.KNIGHT) {
      //     promotionChoice = 'n'
      //   } else if (blackPawnPromotionChoice === BLACK_CHESS_PIECE.BISHOP) {
      //     promotionChoice = 'b'
      //   } else if (blackPawnPromotionChoice === BLACK_CHESS_PIECE.QUEEN) {
      //     promotionChoice = 'q'
      //   }
      // }
      // try {
      //     move = chess.move({
      //     from: sourceSquare,
      //     to: targetSquare,
      //     // promotion: promotionChoice
      //   })
      // } catch(error) {
      //   console.log(error);
      // }
  
      // if (move === null) {
      //   return;
      // }
      // setFen(chess.fen());
      // setHistory(chess.history({verbose: true}));

    }

    function onDragOverSquare(square) {
      if (players.length === 2) {
        if (whitePlayerTimer === 300 && blackPlayerTimer === 300 && !isModalOpen && !isGameStarted) {
          setIsGameStarted(true);
          socket.emit('game start', roomId)
        }
      }
    }
    
    useEffect(() => {
      const newSocket = io('http://localhost:5001');
      console.log("line 200");
      setSocket(newSocket);
      newSocket.emit('join room', roomId, getUsernameFromState());
  
      newSocket.on('moveMade', (move, fen, validMoves, history) => {
        console.log("line 202--------");
        console.log("line 159", move);
        console.log("validMoves", validMoves);
        console.log("history", history);

        // Here you can handle updates of the game state
        setFen(fen); // Update FEN state
        chess.load(fen);
        // dispatch(addFEN(fen));
        setActivePlayer(fen.split(" ")[1])
        setHalfMove(fen.split(" ")[4])
        setFullMove(fen.split(" ")[5]);
        // setLegalMoves(legalMoves);
      });
  
      newSocket.on('room full', () => {
        const confirmSpectator = window.confirm('The room is full. Do you want to join as a spectator?');
        if (confirmSpectator) {
          newSocket.emit('join as spectator', roomId, getUsernameFromState());
        } else {
          navigate('/');
        }
      });

      // newSocket.on('valid move sent', (pieceLegalMoves, pieceLegalMovesNotation) => {
      //   console.log("line 336");
      //   console.log("line 334", pieceLegalMoves);
      //   console.log("line 338");

      //   setLegalPieceMoves(pieceLegalMoves);
      //   setLegalPieceMovesNotation(pieceLegalMovesNotation);
        

      // })

      newSocket.on('start game', (legalMoves) => {
        // setLegalMoves(legalMoves);
        console.log("line 234", legalMoves);
        
      })
  
      newSocket.on('player disconnected', (roomNumber) => {
        if (roomId === roomNumber) {
          alert('Opponent disconnected');
          navigate('/');
        }
      });
  
      newSocket.on('user list update', (userList) => {

        setPlayers(userList.players);
        if (userList.players.length === 1) {
          console.log("line 258");
          setWhitePlayerName(userList.players[0].username)
        }
        if (userList.players.length === 2) {
          console.log("line 262");
          setBlackPlayerName(userList.players[1].username)
        }
        // setSpectators(userList.spectators);
      });

      newSocket.on('checkmate', (winningPlayerColor) => {

        // setIsCheckmate(isCheckmate)

        console.log("line 282", winningPlayerColor);

        setResult(winningPlayerColor)

        if (winningPlayerColor === "White") {
          setResult(RESULT.WHITE)
        } else if (winningPlayerColor === 'Black'){
          setResult(RESULT.BLACK)
        }

        setIsGameStarted(false)
        setIsModalOpen(true)
        // chess.reset()
      })

      // newSocket.on('game over draw', (drawReason) => {
      //   // setResult(RESULT.DRAW);
      //   setIsGameStarted(false)
      //   setIsModalOpen(true)
      // })

      // newSocket.on('history sent', (history) => {
      //   setHistory(history);
      //   // dispatch(addSAN(history));
      // })

      // // server should emit this event when there is 2 players and the game gets started.
      // newSocket.on('time update', (timerValues, userList) => {
      //   setWhitePlayerTimer(timerValues[userList[0].id])
      //   setBlackPlayerTimer(timerValues[userList[1].id])
  
      // });

      // newSocket.on('forfeit sent', (activePlayer) => {
      //   console.log("line 21...", activePlayer);
        
      //   setIsGameStarted(false)
      //   if (activePlayer === 'w') {
      //     setResult("0-1")
      //   } else if (activePlayer === 'b') {
      //     setResult("1-0")
      //   }
      //   setIsModalOpen(true)
        
      // });

      // newSocket.on('offer draw sent', (activePlayers, socketId) => {
      //   console.log("line 21...", activePlayers);
      //   console.log(socketId, activePlayers[0].id)
      //   console.log(socketId, activePlayers[1].id);
      //   // setIsGameStarted(false)
      //   // if (activePlayers === 'w') {
      //     if (socketId === activePlayers[0].id || socketId === activePlayers[1].id) {
      //       console.log("line 303");
      //       setIsMessageModalOpen(true)
      //     // }
      //     }
          
      // });

      // newSocket.on('draw sent', () => {
      //     setIsGameStarted(false)
      //     //Show dialog and would relate to socket.io
      //     setResult("1/2-1/2")

      //     setIsModalOpen(true)
      //     setIsMessageModalOpen(false)
      // })

      // newSocket.on('pgn sent', (history) => {
      //     const pgn = {PGN: {
      //       history: history, //chess.history({verbose: true}),
      //       player1: blackPlayerName,
      //       player2: whitePlayerName,
      //       date: new Date(),
      //       winner: true// if no winner, draw, unfinished
      //     }
      //   }
      //     // dispatch(addPGN(pgn))
      // })
  
      return () => {
        newSocket.off('moveMade');
        newSocket.disconnect();
      };
      
    }, [roomId]);

    useEffect(() => {
      console.log("FEN:", fen);
      console.log("History", history);
      // console.log("SAN", SANList);
      console.log("header", header, chess.header());

      // Store the FEN in Redux
      if (isGameStarted) {
        // dispatch(addFEN(fen));
        // dispatch(addSAN(chess.history()));


      }


    }, [fen])

    useEffect(() => {
      if (isGameStarted) {
        if(blackPlayerTimer === 0) {
          // setResult(RESULT.WHITE)
          setIsGameStarted(false)
          setIsModalOpen(true)
        }
        
        if(whitePlayerTimer === 0) {
          // setResult(RESULT.BLACK)
          setIsGameStarted(false)
          setIsModalOpen(true)
        }
      }

    }, [isGameStarted, whitePlayerTimer, blackPlayerTimer])

    const getUsernameFromState = () => {
      const locationState = location.state;
      console.log("line 391", locationState);
      return locationState ? locationState.playerName : '';
    };
  
    return (
      <>
        <MessageModal isOpen={isMessageModalOpen} onClose={()=>setIsMessageModalOpen(false)}
          onOutcomeModalOpen={()=> {

            socket.emit('draw', roomId);

          
        }}> 
          {activePlayer === "w"? 
          "Do you want to accept the draw offer from white player?" : 
          "Do you want to accept the draw offer from black player?"
          }
        </MessageModal>
        <div className='chessboard__wrapper'>
          <div className='chessboard'>
          <div className='chessboard__information'>
            <div>
              Turn: {activePlayer.toUpperCase()}
            </div>
            <div>
              Halfmove: {halfMove}
            </div>
            <div>
              Fullmove: {fullMove}
            </div>
          </div>
          <div className='chessboard__player_info'>
            <div>Black Player: {blackPlayerName} - Timer: {blackPlayerTimer}s</div>
            <div>Current Pawn Promotion Choice: {blackPawnPromotionChoice}</div>
            <div>Please pick pawns promotion choice: {" "}
              <button onClick={() => setBlackPawnPromotionChoice(BLACK_CHESS_PIECE.ROOK)}>{BLACK_CHESS_PIECE.ROOK}</button>
              <button onClick={() => setBlackPawnPromotionChoice(BLACK_CHESS_PIECE.KNIGHT)}>{BLACK_CHESS_PIECE.KNIGHT}</button> 
              <button onClick={() => setBlackPawnPromotionChoice(BLACK_CHESS_PIECE.BISHOP)}>{BLACK_CHESS_PIECE.BISHOP}</button> 
              <button onClick={() => setBlackPawnPromotionChoice(BLACK_CHESS_PIECE.QUEEN)}>{BLACK_CHESS_PIECE.QUEEN}</button></div>
          </div>
          <div className='chessboard__main'>
            <Chessboard 
              position={fen.split(" ")[0]}
              orientation={orientation}
              lightSquareStyle={{backgroundColor: '#eeeed2'}} 
              darkSquareStyle={{backgroundColor: '#769656'}} 
              width={500}
              draggable={true}
              onDrop={onDrop}
              onDragOverSquare={onDragOverSquare}
              squareStyles={sqaureStyles}
              // onPieceClick={onPieceClick}
              onSquareClick={onSquareClick}
              onMouseOverSquare={onMouseOverSquare}
              //Source: https://codesandbox.io/s/21r26yw13j?from-embed=&file=/src/integrations/CustomBoard.js
              pieces={{
                wK: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{WHITE_CHESS_PIECE.KING}</div>
                ),
                wR: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{WHITE_CHESS_PIECE.ROOK}</div>
                ),
                wN: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{WHITE_CHESS_PIECE.KNIGHT}</div>
                ),
                wB: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{WHITE_CHESS_PIECE.BISHOP}</div>
                ),
                wQ: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{WHITE_CHESS_PIECE.QUEEN}</div>
                ),
                wP: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{WHITE_CHESS_PIECE.PAWN}</div>
                ),
                bK: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{BLACK_CHESS_PIECE.KING}</div>
                ),
                bR: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{BLACK_CHESS_PIECE.ROOK}</div>
                ),
                bN: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{BLACK_CHESS_PIECE.KNIGHT}</div>
                ),
                bB: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{BLACK_CHESS_PIECE.BISHOP}</div>
                ),
                bQ: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{BLACK_CHESS_PIECE.QUEEN}</div>
                ),
                bP: () => (
                  <div style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    fontSize: 'xxx-large'
                  }}>{BLACK_CHESS_PIECE.PAWN}</div>
                )
              }}
            />
          </div>
          <div className='chessboard__player_info'>
            <div>White Player: {whitePlayerName} - Timer: {whitePlayerTimer}s</div>
            <div>Current Pawn Promotion Choice: {whitePawnPromotionChoice}</div>
            <div>Please pick pawns promottion choice: {" "}
              <button onClick={() => setWhitePawnPromotionChoice(WHITE_CHESS_PIECE.ROOK)}>{WHITE_CHESS_PIECE.ROOK}</button> 
              <button onClick={() => setWhitePawnPromotionChoice(WHITE_CHESS_PIECE.KNIGHT)}>{WHITE_CHESS_PIECE.KNIGHT}</button> 
              <button onClick={() => setWhitePawnPromotionChoice(WHITE_CHESS_PIECE.BISHOP)}>{WHITE_CHESS_PIECE.BISHOP}</button> 
              <button onClick={() => setWhitePawnPromotionChoice(WHITE_CHESS_PIECE.QUEEN)}>{WHITE_CHESS_PIECE.QUEEN}</button> </div>
          </div>
          </div>
        </div>
      </>
    )
}

