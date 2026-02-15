import { prisma } from './src/lib/db'

async function testConnection() {
    try {
        console.log('🔍 Probando conexión a la base de datos...')

        // Intentar obtener todos los hábitos
        const habits = await prisma.habit.findMany({
            include: {
                completions: true,
            },
        })

        console.log('✅ Conexión exitosa!')
        console.log(`📊 Total de hábitos encontrados: ${habits.length}`)

        if (habits.length > 0) {
            console.log('\n📝 Lista de hábitos:')
            habits.forEach((habit, index) => {
                console.log(`\n${index + 1}. ${habit.title}`)
                console.log(`   ID: ${habit.id}`)
                console.log(`   Descripción: ${habit.description || 'Sin descripción'}`)
                console.log(`   Color: ${habit.color}`)
                console.log(`   Completados: ${habit.completions.length} veces`)
            })
        } else {
            console.log('\n📭 No hay hábitos registrados todavía.')
            console.log('💡 Puedes crear uno usando la API POST /api/habits')
        }

    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testConnection()
