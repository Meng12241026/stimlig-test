import Foundation
import SwiftData

/// 集中管理 SwiftData 的 ModelContainer。
enum DataController {
    static let schema = Schema([Invoice.self])

    static func makeContainer(inMemory: Bool = false) -> ModelContainer {
        let config = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: inMemory
        )
        do {
            return try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("無法建立 ModelContainer：\(error)")
        }
    }
}
