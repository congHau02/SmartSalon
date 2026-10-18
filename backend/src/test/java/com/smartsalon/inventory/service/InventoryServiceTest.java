package com.smartsalon.inventory.service;

import com.smartsalon.branch.entity.BranchEntity;
import com.smartsalon.branch.repository.BranchRepository;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.inventory.dto.BranchInventoryResponse;
import com.smartsalon.inventory.dto.StockAdjustmentRequest;
import com.smartsalon.inventory.dto.StockInRequest;
import com.smartsalon.inventory.entity.BranchInventoryEntity;
import com.smartsalon.inventory.entity.InventoryTransactionEntity;
import com.smartsalon.inventory.entity.InventoryTransactionType;
import com.smartsalon.inventory.entity.ProductEntity;
import com.smartsalon.inventory.repository.BranchInventoryRepository;
import com.smartsalon.inventory.repository.InventoryTransactionRepository;
import com.smartsalon.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private BranchInventoryRepository branchInventoryRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private BranchRepository branchRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private BranchEntity branch;
    private ProductEntity product;
    private BranchInventoryEntity branchInventory;

    @BeforeEach
    void setUp() {
        branch = BranchEntity.builder()
                .name("Flagship Q1")
                .isActive(true)
                .build();
        branch.setId(1L);

        product = ProductEntity.builder()
                .name("Olaplex No.1 Bond Multiplier")
                .sku("OLA-NO1-525")
                .unit("chai")
                .volumeOrWeightPerUnit(new BigDecimal("525.00"))
                .volumeUnit("ml")
                .minStockAlertUnits(2)
                .costPrice(new BigDecimal("1200000.00"))
                .retailPrice(new BigDecimal("1800000.00"))
                .isActive(true)
                .build();
        product.setId(10L);

        branchInventory = BranchInventoryEntity.builder()
                .branch(branch)
                .product(product)
                .stockUnits(3)
                .currentVolume(new BigDecimal("25.00"))
                .minStockAlertUnits(2)
                .build();
        branchInventory.setId(100L);
    }

    @Test
    @DisplayName("Nhập kho: Tăng số lượng đóng gói nguyên seal, cập nhật giá vốn và ghi nhận giao dịch STOCK_IN")
    void shouldStockInAndCalculateVolumeCorrectly() {
        StockInRequest request = StockInRequest.builder()
                .productId(10L)
                .quantityUnits(5)
                .unitCost(new BigDecimal("1150000.00"))
                .notes("Lô hàng mới nhập từ công ty phân phối")
                .build();

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(product));
        when(branchInventoryRepository.findByBranchIdAndProductIdForUpdate(1L, 10L)).thenReturn(Optional.of(branchInventory));
        when(branchInventoryRepository.save(any(BranchInventoryEntity.class))).thenAnswer(i -> i.getArgument(0));

        BranchInventoryResponse response = inventoryService.stockIn(1L, request);

        // 3 ban đầu + 5 nhập = 8
        assertEquals(8, response.getStockUnits());
        assertEquals(new BigDecimal("25.00"), response.getCurrentVolume());
        // Giá vốn cập nhật
        assertEquals(new BigDecimal("1150000.00"), product.getCostPrice());

        ArgumentCaptor<InventoryTransactionEntity> txCaptor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository).save(txCaptor.capture());
        InventoryTransactionEntity tx = txCaptor.getValue();

        assertEquals(InventoryTransactionType.STOCK_IN, tx.getTransactionType());
        assertEquals(5, tx.getQuantityUnits());
        assertEquals(new BigDecimal("2625.00"), tx.getVolumeAmount()); // 5 * 525ml = 2625ml
        assertEquals("ml", tx.getUnit());
        // Tổng tồn sau nhập: 8 * 525 + 25 = 4225ml
        assertEquals(new BigDecimal("4225.00"), tx.getBalanceAfterVolume());
    }

    @Test
    @DisplayName("Tiêu hao dịch vụ: Trừ trực tiếp từ dung tích dở dang khi dung tích dở dang còn đủ")
    void shouldDeductFromCurrentVolumeWithoutUnsealingWhenSufficient() {
        // Dung tích hiện có: 25ml, cần dùng 15ml
        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(product));
        when(branchInventoryRepository.findByBranchIdAndProductIdForUpdate(1L, 10L)).thenReturn(Optional.of(branchInventory));
        when(branchInventoryRepository.save(any(BranchInventoryEntity.class))).thenAnswer(i -> i.getArgument(0));

        BranchInventoryResponse response = inventoryService.deductConsumables(1L, 10L, new BigDecimal("15.00"), 5001L);

        // Nguyên seal giữ nguyên 3 chai, dung tích giảm 25 - 15 = 10ml
        assertEquals(3, response.getStockUnits());
        assertEquals(new BigDecimal("10.00"), response.getCurrentVolume());

        ArgumentCaptor<InventoryTransactionEntity> txCaptor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository).save(txCaptor.capture());
        InventoryTransactionEntity tx = txCaptor.getValue();

        assertEquals(InventoryTransactionType.SERVICE_CONSUMPTION, tx.getTransactionType());
        assertEquals(0, tx.getQuantityUnits());
        assertEquals(new BigDecimal("-15.00"), tx.getVolumeAmount());
        // Tổng tồn: 3 * 525 + 10 = 1585ml
        assertEquals(new BigDecimal("1585.00"), tx.getBalanceAfterVolume());
        assertEquals(5001L, tx.getReferenceOrderId());
        assertEquals(new BigDecimal("2285.7143"), tx.getUnitCostSnapshot());
        assertEquals(new BigDecimal("34285.71"), tx.getTotalCostAmount());
    }

    @Test
    @DisplayName("Auto-Unseal Engine: Tự động khui 1 chai nguyên seal khi dung tích dở dang không đủ")
    void shouldAutoUnsealOneUnitWhenCurrentVolumeInsufficient() {
        // Hiện có 25ml, cần 60ml -> thiếu 35ml -> khui 1 chai 525ml
        // Dung tích sau khui: 25 + 525 = 550ml -> trừ 60ml còn 490ml
        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(product));
        when(branchInventoryRepository.findByBranchIdAndProductIdForUpdate(1L, 10L)).thenReturn(Optional.of(branchInventory));
        when(branchInventoryRepository.save(any(BranchInventoryEntity.class))).thenAnswer(i -> i.getArgument(0));

        BranchInventoryResponse response = inventoryService.deductConsumables(1L, 10L, new BigDecimal("60.00"), 5002L);

        // 3 chai - 1 chai khui = 2 chai nguyên seal
        assertEquals(2, response.getStockUnits());
        assertEquals(new BigDecimal("490.00"), response.getCurrentVolume());

        ArgumentCaptor<InventoryTransactionEntity> txCaptor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository, times(2)).save(txCaptor.capture());
        var transactions = txCaptor.getAllValues();

        // Giao dịch 1: Khui nắp
        InventoryTransactionEntity unsealTx = transactions.get(0);
        assertEquals(InventoryTransactionType.AUTO_UNSEAL, unsealTx.getTransactionType());
        assertEquals(-1, unsealTx.getQuantityUnits());
        assertEquals(new BigDecimal("525.00"), unsealTx.getVolumeAmount());

        // Giao dịch 2: Tiêu hao
        InventoryTransactionEntity consumeTx = transactions.get(1);
        assertEquals(InventoryTransactionType.SERVICE_CONSUMPTION, consumeTx.getTransactionType());
        assertEquals(0, consumeTx.getQuantityUnits());
        assertEquals(new BigDecimal("-60.00"), consumeTx.getVolumeAmount());
        // Tổng tồn sau tiêu hao: 2 * 525 + 490 = 1540ml
        assertEquals(new BigDecimal("1540.00"), consumeTx.getBalanceAfterVolume());
    }

    @Test
    @DisplayName("Auto-Unseal Engine: Tự động khui nhiều chai khi lượng thiếu vượt quá 1 đơn vị")
    void shouldAutoUnsealMultipleUnitsWhenDeficitExceedsOneUnit() {
        // Hiện có 25ml, cần 1100ml -> thiếu 1075ml -> cần ceil(1075 / 525) = 3 chai
        // Dung tích sau khui: 25 + (3 * 525) = 25 + 1575 = 1600ml
        // Sau khi trừ 1100ml -> còn 500ml
        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(product));
        when(branchInventoryRepository.findByBranchIdAndProductIdForUpdate(1L, 10L)).thenReturn(Optional.of(branchInventory));
        when(branchInventoryRepository.save(any(BranchInventoryEntity.class))).thenAnswer(i -> i.getArgument(0));

        BranchInventoryResponse response = inventoryService.deductConsumables(1L, 10L, new BigDecimal("1100.00"), 5003L);

        // 3 chai - 3 chai khui = 0 chai
        assertEquals(0, response.getStockUnits());
        assertEquals(new BigDecimal("500.00"), response.getCurrentVolume());
    }

    @Test
    @DisplayName("Chặn xuất kho: Báo lỗi INSUFFICIENT_STOCK khi cả dung tích dở dang và chai nguyên seal đều không đủ")
    void shouldThrowInsufficientStockWhenStockExhausted() {
        // Cần 2000ml -> thiếu 1975ml -> cần 4 chai nhưng kho chỉ có 3 chai
        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(product));
        when(branchInventoryRepository.findByBranchIdAndProductIdForUpdate(1L, 10L)).thenReturn(Optional.of(branchInventory));

        AppException ex = assertThrows(AppException.class, () ->
                inventoryService.deductConsumables(1L, 10L, new BigDecimal("2000.00"), 5004L)
        );

        assertEquals(ErrorCode.INSUFFICIENT_STOCK, ex.getErrorCode());
        verify(branchInventoryRepository, never()).save(any());
        verify(inventoryTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Kiểm kê điều chỉnh kho: Cập nhật số lượng seal thực tế và dung tích thực tế, ghi nhận chênh lệch")
    void shouldPerformStockAdjustmentAndRecordDiscrepancy() {
        StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                .productId(10L)
                .actualStockUnits(2)
                .actualVolume(new BigDecimal("10.00"))
                .reason("Kiểm kê cuối tháng, phát hiện hao hụt 1 chai vỡ và bay hơi 15ml")
                .build();

        when(branchRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(branch));
        when(productRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(product));
        when(branchInventoryRepository.findByBranchIdAndProductIdForUpdate(1L, 10L)).thenReturn(Optional.of(branchInventory));
        when(branchInventoryRepository.save(any(BranchInventoryEntity.class))).thenAnswer(i -> i.getArgument(0));

        BranchInventoryResponse response = inventoryService.stockAdjustment(1L, request);

        assertEquals(2, response.getStockUnits());
        assertEquals(new BigDecimal("10.00"), response.getCurrentVolume());

        ArgumentCaptor<InventoryTransactionEntity> txCaptor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(inventoryTransactionRepository).save(txCaptor.capture());
        InventoryTransactionEntity tx = txCaptor.getValue();

        assertEquals(InventoryTransactionType.STOCK_ADJUSTMENT, tx.getTransactionType());
        assertEquals(-1, tx.getQuantityUnits()); // 2 - 3 = -1
        assertEquals(new BigDecimal("-15.00"), tx.getVolumeAmount()); // 10 - 25 = -15
        // Tổng tồn: 2 * 525 + 10 = 1060ml
        assertEquals(new BigDecimal("1060.00"), tx.getBalanceAfterVolume());
    }
}
