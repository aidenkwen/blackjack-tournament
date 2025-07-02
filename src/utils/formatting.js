export const normalizeAccount = (acc) =>
  String(acc).replace(/\D/g, '').padStart(14, '0');

export const amountsMatch = (need, a1, a2 = 0) =>
  Number(a1 || 0) + Number(a2 || 0) === Number(need);

export const UC = (v) => (v || '').toUpperCase();

export const fmtTypes = (t1, t2) => (t2 ? `${t1}+${t2}` : t1);

export const normalizePlayerData = (playerData) => {
  if (!playerData) return {};
  return {
    playerAccountNumber: playerData.PlayerAccountNumber || 
                        playerData['Player Account Number'] || 
                        playerData.playerAccountNumber || 
                        playerData.AccountNumber,
    firstName: playerData.FirstName || 
               playerData['First Name'] || 
               playerData.firstName,
    lastName: playerData.LastName || 
              playerData['Last Name'] || 
              playerData.lastName,
    entryType: playerData.EntryType || 
               playerData['Entry Type'] || 
               playerData.entryType,
    host: playerData.Host || 
          playerData.host || 
          ''
  };
};