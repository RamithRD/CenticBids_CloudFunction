const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotification = functions.firestore.document('auction_items/{uid}').onUpdate(async (event) => {

     const userId = event.after.get('latest_bid_uid');
     const title = event.after.get('auction_title');
     const content = "You have been outbid, bid again to get on top!";
     let bidHistory = event.after.get('bidding_history');

     let previousBidderArr = [];

     for (var i = 0; i < bidHistory.length; i++) {

        if(bidHistory[i].user_id !== userId){
            previousBidderArr[i] = bidHistory[i].user_id;
        }
    
     }

     var biddersArr = filterRepeatedUids(previousBidderArr);


     let fcmTokensArr = [];

     /* eslint-disable no-await-in-loop */
     for(var k = 0; k < biddersArr.length; k++){

        let userDoc = await admin.firestore().doc(`registered_users/${biddersArr[k]}`).get();
        let fcmToken = userDoc.get('fcm_token');
        fcmTokensArr[k] = fcmToken;

     }
     /* eslint-disable no-await-in-loop */

     console.log(fcmTokensArr);

     /* eslint-disable no-await-in-loop */
     for(var m = 0; m < fcmTokensArr.length; m++){

        var message = {

            notification:{
                title: title,
                body: content,
            },
            token: fcmTokensArr[m]
         }
    
         let response = await admin.messaging().send(message);
         console.log(response);

     }
     /* eslint-disable no-await-in-loop */

});

function filterRepeatedUids(array){
    var len = array.length;
    for(var i = 0; i < len; i++) for(var j = i + 1; j < len; j++) 
        if(array[j] === array[i]){
            array.splice(j,1);
            j--;
            len--;
        }
    return array;
}
