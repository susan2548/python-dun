export const coinIcon=()=>'<img class="coin-icon" src="./assets/icons/coin.svg" alt="" aria-hidden="true">';
export const coinAmount=amount=>`<span class="coin-amount">${coinIcon()}<b>${Math.max(0,Number(amount)||0)}</b><span>เหรียญ</span></span>`;
