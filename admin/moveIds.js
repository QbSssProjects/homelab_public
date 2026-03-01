/*JEŚLI ZAJDZIE POTRZEBA PRZENIEŚĆ DANE STWORZONE PRZEZ User.old na User
* Wykonuj tę klasę w OLD_USER_ID Dajesz ID user.old
* W NEW_USER_ID dajesz Id nowego Usera
*/

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const OLD_USER_ID = '';
const NEW_USER_ID = '';

async function migrateUserData() {
    try {
        console.log('🚀 Starting migration...');
        console.log(`From: ${OLD_USER_ID}`);
        console.log(`To: ${NEW_USER_ID}`);

        // Collections to migrate
        const collections = ['categories', 'parameters', 'components', 'counters'];

        for (const collectionName of collections) {
            console.log(`\n📦 Migrating ${collectionName}...`);

            const oldPath = `artifacts/default-app-id/users/${OLD_USER_ID}/${collectionName}`;
            const newPath = `artifacts/default-app-id/users/${NEW_USER_ID}/${collectionName}`;

            const snapshot = await db.collection(oldPath).get();

            if (snapshot.empty) {
                console.log(`   ⚠️  No documents found in ${collectionName}`);
                continue;
            }

            console.log(`   Found ${snapshot.size} documents`);

            const batch = db.batch();
            let count = 0;

            snapshot.forEach((doc) => {
                const newDocRef = db.collection(newPath).doc(doc.id);
                batch.set(newDocRef, doc.data());
                count++;

                // Firestore batch limit is 500
                if (count >= 500) {
                    console.log('   Committing batch of 500...');
                    batch.commit();
                    count = 0;
                }
            });

            if (count > 0) {
                await batch.commit();
            }

            console.log(`   ✅ Migrated ${snapshot.size} documents from ${collectionName}`);
        }

        // Migrate uploaded_documents (shared collection)
        console.log('\n📄 Migrating uploaded_documents...');
        const docsSnapshot = await db.collection('uploaded_documents')
            .where('userId', '==', OLD_USER_ID)
            .get();

        if (!docsSnapshot.empty) {
            const batch = db.batch();
            docsSnapshot.forEach((doc) => {
                const docRef = db.collection('uploaded_documents').doc(doc.id);
                batch.update(docRef, { userId: NEW_USER_ID });
            });
            await batch.commit();
            console.log(`   ✅ Updated ${docsSnapshot.size} documents`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n⚠️  IMPORTANT: Verify data before deleting old user data!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrateUserData();