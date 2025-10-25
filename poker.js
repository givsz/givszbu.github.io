// 포커 게임 클래스
class PokerGame {
    constructor() {
        this.suits = ['♠', '♥', '♦', '♣'];
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];
        this.player1Hand = [];
        this.player2Hand = [];
        this.communityCards = [];
        this.pot = 0;
        this.player1Chips = 1000;
        this.player2Chips = 1000;
        this.currentBet = 0;
        this.gamePhase = 'preflop'; // preflop, flop, turn, river

        this.initDeck();
        this.initEventListeners();
        this.updateDisplay();
    }

    // 덱 초기화
    initDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let rank of this.ranks) {
                this.deck.push({
                    suit: suit,
                    rank: rank,
                    color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
                });
            }
        }
    }

    // 덱 섞기
    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        this.updateStatus('덱을 섞었습니다.');
    }

    // 새 게임 시작
    newGame() {
        this.initDeck();
        this.shuffle();
        this.player1Hand = [];
        this.player2Hand = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.gamePhase = 'preflop';

        this.clearHands();
        this.clearCommunityCards();
        this.updateDisplay();
        this.updateStatus('새 게임을 시작했습니다. "딜" 버튼을 눌러 카드를 나눠주세요.');
    }

    // 카드 나눠주기
    deal() {
        if (this.deck.length < 4) {
            this.updateStatus('덱에 카드가 부족합니다. 새 게임을 시작하세요.');
            return;
        }

        this.player1Hand = [this.deck.pop(), this.deck.pop()];
        this.player2Hand = [this.deck.pop(), this.deck.pop()];

        this.renderHand('player1-hand', this.player1Hand, true);
        this.renderHand('player2-hand', this.player2Hand, false);

        this.gamePhase = 'preflop';
        this.updateStatus('카드를 나눠주었습니다. 베팅을 시작하세요.');
        this.evaluateHand();
    }

    // 플랍 (3장)
    dealFlop() {
        if (this.communityCards.length > 0) {
            this.updateStatus('플랍은 이미 오픈되었습니다.');
            return;
        }
        if (this.deck.length < 3) {
            this.updateStatus('덱에 카드가 부족합니다.');
            return;
        }

        this.communityCards.push(this.deck.pop());
        this.communityCards.push(this.deck.pop());
        this.communityCards.push(this.deck.pop());

        this.renderCommunityCards();
        this.gamePhase = 'flop';
        this.updateStatus('플랍을 오픈했습니다.');
        this.evaluateHand();
    }

    // 턴 (4번째 카드)
    dealTurn() {
        if (this.communityCards.length !== 3) {
            this.updateStatus('먼저 플랍을 오픈하세요.');
            return;
        }
        if (this.deck.length < 1) {
            this.updateStatus('덱에 카드가 부족합니다.');
            return;
        }

        this.communityCards.push(this.deck.pop());
        this.renderCommunityCards();
        this.gamePhase = 'turn';
        this.updateStatus('턴 카드를 오픈했습니다.');
        this.evaluateHand();
    }

    // 리버 (5번째 카드)
    dealRiver() {
        if (this.communityCards.length !== 4) {
            this.updateStatus('먼저 턴을 오픈하세요.');
            return;
        }
        if (this.deck.length < 1) {
            this.updateStatus('덱에 카드가 부족합니다.');
            return;
        }

        this.communityCards.push(this.deck.pop());
        this.renderCommunityCards();
        this.gamePhase = 'river';
        this.updateStatus('리버 카드를 오픈했습니다. 최종 베팅을 진행하세요.');
        this.evaluateHand();
    }

    // 카드 렌더링
    renderHand(elementId, hand, faceDown = false) {
        const handArea = document.getElementById(elementId);
        handArea.innerHTML = '';

        hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, faceDown);
            cardEl.dataset.player = elementId;
            cardEl.dataset.index = index;

            // 애니메이션 추가
            cardEl.classList.add('dealing');
            setTimeout(() => {
                cardEl.classList.remove('dealing');
            }, 500);

            handArea.appendChild(cardEl);
        });
    }

    // 커뮤니티 카드 렌더링
    renderCommunityCards() {
        const communityArea = document.getElementById('community-cards');
        const slots = communityArea.querySelectorAll('.card-slot');

        this.communityCards.forEach((card, index) => {
            if (!slots[index].querySelector('.card')) {
                const cardEl = this.createCardElement(card, false);
                cardEl.classList.add('dealing');
                setTimeout(() => {
                    cardEl.classList.remove('dealing');
                }, 500);
                slots[index].innerHTML = '';
                slots[index].appendChild(cardEl);
            }
        });
    }

    // 카드 엘리먼트 생성
    createCardElement(card, faceDown = false) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color}`;
        cardEl.draggable = true;

        if (faceDown) {
            cardEl.classList.add('flipped');
            cardEl.innerHTML = `<div style="font-size: 12px;">CARD</div>`;
        } else {
            cardEl.innerHTML = `
                <div class="card-rank">${card.rank}</div>
                <div class="card-suit">${card.suit}</div>
                <div class="card-rank">${card.rank}</div>
            `;
        }

        // 드래그 이벤트
        cardEl.addEventListener('dragstart', this.handleDragStart.bind(this));
        cardEl.addEventListener('dragend', this.handleDragEnd.bind(this));

        // 클릭으로 카드 뒤집기
        cardEl.addEventListener('click', () => {
            if (cardEl.classList.contains('flipped')) {
                cardEl.classList.add('flipping');
                setTimeout(() => {
                    cardEl.classList.remove('flipped');
                    cardEl.innerHTML = `
                        <div class="card-rank">${card.rank}</div>
                        <div class="card-suit">${card.suit}</div>
                        <div class="card-rank">${card.rank}</div>
                    `;
                    cardEl.classList.remove('flipping');
                }, 300);
            } else {
                cardEl.classList.add('flipping');
                setTimeout(() => {
                    cardEl.classList.add('flipped');
                    cardEl.innerHTML = `<div style="font-size: 12px;">CARD</div>`;
                    cardEl.classList.remove('flipping');
                }, 300);
            }
        });

        return cardEl;
    }

    // 드래그 시작
    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    // 드래그 종료
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    // 핸드 평가
    evaluateHand() {
        if (this.player2Hand.length === 0) return;

        const allCards = [...this.player2Hand, ...this.communityCards];
        if (allCards.length < 2) return;

        const rank = this.getHandRank(allCards);
        document.getElementById('hand-rank').textContent = rank;
    }

    // 포커 핸드 랭킹 계산
    getHandRank(cards) {
        if (cards.length < 2) return '-';

        const rankValues = {
            'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
            '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
        };

        const suits = cards.map(c => c.suit);
        const ranks = cards.map(c => rankValues[c.rank]).sort((a, b) => b - a);

        // 같은 숫자 카운트
        const rankCounts = {};
        ranks.forEach(rank => {
            rankCounts[rank] = (rankCounts[rank] || 0) + 1;
        });

        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

        // 플러시 체크
        const isFlush = suits.length >= 5 &&
            suits.some(suit => suits.filter(s => s === suit).length >= 5);

        // 스트레이트 체크
        const isStraight = this.checkStraight(uniqueRanks);

        // 핸드 판정
        if (isFlush && isStraight) {
            if (uniqueRanks.includes(14) && uniqueRanks.includes(13)) {
                return '로얄 플러시';
            }
            return '스트레이트 플러시';
        }
        if (counts[0] === 4) return '포카드';
        if (counts[0] === 3 && counts[1] >= 2) return '풀하우스';
        if (isFlush) return '플러시';
        if (isStraight) return '스트레이트';
        if (counts[0] === 3) return '트리플';
        if (counts[0] === 2 && counts[1] === 2) return '투페어';
        if (counts[0] === 2) return '원페어';

        return '하이카드';
    }

    // 스트레이트 체크
    checkStraight(ranks) {
        if (ranks.length < 5) return false;

        for (let i = 0; i <= ranks.length - 5; i++) {
            let consecutive = true;
            for (let j = 0; j < 4; j++) {
                if (ranks[i + j] - ranks[i + j + 1] !== 1) {
                    consecutive = false;
                    break;
                }
            }
            if (consecutive) return true;
        }

        // A-2-3-4-5 스트레이트 체크
        if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) &&
            ranks.includes(4) && ranks.includes(5)) {
            return true;
        }

        return false;
    }

    // 베팅
    bet(amount) {
        if (this.player2Chips < amount) {
            this.updateStatus('칩이 부족합니다.');
            return;
        }

        this.player2Chips -= amount;
        this.pot += amount;
        this.currentBet = amount;
        this.updateDisplay();
        this.updateStatus(`${amount} 칩을 베팅했습니다.`);
    }

    // 폴드
    fold() {
        this.updateStatus('폴드했습니다. 새 게임을 시작하세요.');
        this.player1Chips += this.pot;
        this.pot = 0;
        this.updateDisplay();
    }

    // 체크
    check() {
        this.updateStatus('체크했습니다.');
    }

    // 콜
    call() {
        this.bet(this.currentBet);
    }

    // 레이즈
    raise() {
        const amount = parseInt(document.getElementById('bet-amount').value) || 50;
        this.bet(amount);
    }

    // 디스플레이 업데이트
    updateDisplay() {
        document.getElementById('pot-amount').textContent = this.pot;
        document.getElementById('player1-chips').textContent = this.player1Chips;
        document.getElementById('player2-chips').textContent = this.player2Chips;
    }

    // 상태 업데이트
    updateStatus(message) {
        document.getElementById('game-status').textContent = message;
    }

    // 핸드 클리어
    clearHands() {
        document.getElementById('player1-hand').innerHTML = '';
        document.getElementById('player2-hand').innerHTML = '';
    }

    // 커뮤니티 카드 클리어
    clearCommunityCards() {
        const communityArea = document.getElementById('community-cards');
        const slots = communityArea.querySelectorAll('.card-slot');
        slots.forEach(slot => {
            slot.innerHTML = '';
        });
    }

    // 이벤트 리스너 초기화
    initEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffle());
        document.getElementById('deal-btn').addEventListener('click', () => this.deal());
        document.getElementById('flop-btn').addEventListener('click', () => this.dealFlop());
        document.getElementById('turn-btn').addEventListener('click', () => this.dealTurn());
        document.getElementById('river-btn').addEventListener('click', () => this.dealRiver());

        document.getElementById('fold-btn').addEventListener('click', () => this.fold());
        document.getElementById('check-btn').addEventListener('click', () => this.check());
        document.getElementById('call-btn').addEventListener('click', () => this.call());
        document.getElementById('raise-btn').addEventListener('click', () => this.raise());

        // 드래그 앤 드롭 영역 설정
        const dropZones = [
            document.getElementById('player1-hand'),
            document.getElementById('player2-hand'),
            document.getElementById('community-cards')
        ];

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.style.background = 'rgba(255,255,255,0.3)';
            });

            zone.addEventListener('dragleave', (e) => {
                zone.style.background = '';
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.style.background = '';
                // 드롭 처리는 실제 게임 로직에 따라 구현
            });
        });
    }
}

// 게임 초기화
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new PokerGame();
    game.updateStatus('포커 테이블탑 시뮬레이터에 오신 것을 환영합니다! "새 게임"을 눌러 시작하세요.');
});
