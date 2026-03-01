const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console
const readline = require('readline');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const USER_ID = 'qVa0EXlarLRgODnhwyXJVAPvcsy2';
const collectionName = 'components';
const collectionPath = `artifacts/default-app-id/users/${USER_ID}/${collectionName}`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const oldStatus = 'W realizacji';
const newStatus = 'Sprzedany';

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function updateStatus() {
    try {
        console.log(`🚀 Pobieranie elementów ze statusem "${oldStatus}"...`);

        const snapshot = await db.collection(collectionPath)
            .where('status', '==', oldStatus)
            .get();

        if (snapshot.empty) {
            console.log(`⚠️  Brak elementów ze statusem "${oldStatus}"`);
            rl.close();
            process.exit();
        }

        console.log(`Znaleziono ${snapshot.size} elementów`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log('\n--- Element:', doc.id, '---');
            for (const [key, value] of Object.entries(data)) {
                console.log(`${key}: ${value}`);
            }

            const answer = await askQuestion(`czy ${newStatus} (Y/n): `);
            if (answer.toLowerCase() === 'y' || answer === '') {
                await db.collection(collectionPath).doc(doc.id).update({ status: newStatus });
                console.log(`✅ Zaktualizowano na "${newStatus}"`);
            } else {
                console.log('⏭️  Pominięto');
            }
        }

        console.log('\n🎉 Przetwarzanie zakończone!');

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        rl.close();
        process.exit();
    }
}

updateStatus();