import SwiftUI
import SwiftData
import UIKit

/// 啟動相機/相簿拍照、跑 OCR、確認後存進 SwiftData。
struct ScanFlowView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var pickedImage: UIImage?
    @State private var processing = false
    @State private var draft: Invoice?
    @State private var errorMessage: String?
    @State private var showingPicker = false
    @State private var pickerSource: ImagePicker.Source = .camera

    let processor = InvoiceProcessingService()

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("掃描發票")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("取消") { dismiss() }
                    }
                }
                .sheet(isPresented: $showingPicker) {
                    ImagePicker(source: pickerSource) { image in
                        pickedImage = image
                        Task { await runOCR(on: image) }
                    }
                    .ignoresSafeArea()
                }
                .alert("OCR 失敗", isPresented: errorBinding) {
                    Button("知道了", role: .cancel) { errorMessage = nil }
                } message: {
                    Text(errorMessage ?? "")
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if processing {
            VStack(spacing: 16) {
                ProgressView()
                Text("辨識中…")
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let draft {
            InvoiceEditorView(invoice: draft) {
                context.insert(draft)
                try? context.save()
                dismiss()
            }
        } else {
            startScreen
        }
    }

    private var startScreen: some View {
        VStack(spacing: 24) {
            Image(systemName: "doc.viewfinder.fill")
                .font(.system(size: 80))
                .foregroundStyle(.tint)
            Text("拍下發票，自動填好金額與分類")
                .font(.headline)
                .multilineTextAlignment(.center)

            Button {
                pickerSource = .camera
                showingPicker = true
            } label: {
                Label("開啟相機", systemImage: "camera.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(!UIImagePickerController.isSourceTypeAvailable(.camera))

            Button {
                pickerSource = .photoLibrary
                showingPicker = true
            } label: {
                Label("從相簿選取", systemImage: "photo.on.rectangle")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
        }
        .padding(32)
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )
    }

    private func runOCR(on image: UIImage) async {
        processing = true
        defer { processing = false }
        do {
            draft = try await processor.process(image: image)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    ScanFlowView()
        .modelContainer(DataController.makeContainer(inMemory: true))
}
