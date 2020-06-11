const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.sendNotification = functions.firestore.document('auction_items/{uid}').onUpdate(async (event) => {

    //retrieve the UID of the highest bidder
     const userId = event.after.get('latest_bid_uid');

     //retrieve the auction item title for notification header
     const title = event.after.get('auction_title');

     //body of the notification
     const content = "You have been outbid, bid again to get on top!";

     //retrieve the bidding history array for the item
     let bidHistory = event.after.get('bidding_history');

     let previousBidderArr = [];

     //loop through the bidding history array and get all UIDs of auction participants
     for (var i = 0; i < bidHistory.length; i++) {

        previousBidderArr[i] = bidHistory[i].user_id;
    
     }

     //eliminate repeated UIDs from array
     var biddersArr =  previousBidderArr.filter( function( item, index, inputArray ) {
        return inputArray.indexOf(item) === index;
    });

     console.log(biddersArr);

     //remove the UID of the highest bidder because we only want to send the notification to users who have been outbid
    var index = biddersArr.indexOf(userId); 
    if (index > -1) { //if found
        biddersArr.splice(index, 1);
    }

     let fcmTokensArr = [];

     //Read the registered_users document using the UIDs and retrieving their FCM tokens into an array

     /* eslint-disable no-await-in-loop */
     for(var k = 0; k < biddersArr.length; k++){

        let userDoc = await admin.firestore().doc(`registered_users/${biddersArr[k]}`).get();
        let fcmToken = userDoc.get('fcm_token');
        fcmTokensArr[k] = fcmToken;

     }
     /* eslint-disable no-await-in-loop */

     console.log(fcmTokensArr);
     

     //For each FCM token in array, fire the notification

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

