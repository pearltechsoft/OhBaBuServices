package com.ohbabu.web;

import java.util.List;

import javax.annotation.security.PermitAll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ohbabu.exception.RecordNotFoundException;
import com.ohbabu.model.ProviderSlot;
import com.ohbabu.service.ProviderSlotService;

@RestController
@RequestMapping("/provider-slots")
public class ProviderSlotController {

    @Autowired
    private ProviderSlotService providerSlotService;

    /**
     * Get all slots for a provider
     */
    @PermitAll
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<List<ProviderSlot>> getSlotsByProviderId(
            @PathVariable Long providerId) {

        List<ProviderSlot> slots =
                providerSlotService.getSlotsByProviderId(providerId);

        return ResponseEntity.ok(slots);
    }

    /**
     * Get single slot by provider + slot id
     */
    @PermitAll
    @GetMapping("/provider/{providerId}/{slotId}")
    public ResponseEntity<ProviderSlot> getSlotById(
            @PathVariable Long providerId,
            @PathVariable Long slotId)
            throws RecordNotFoundException {

        ProviderSlot slot =
                providerSlotService.getSlotByIdAndProvider(
                        slotId,
                        providerId);

        return ResponseEntity.ok(slot);
    }

    /**
     * Create slot for a provider
     */
    @PermitAll
    @PostMapping("/provider/{providerId}")
    public ResponseEntity<ProviderSlot> createSlot(
            @PathVariable Long providerId,
            @RequestBody ProviderSlot request) {

        // Enforce provider ownership
        request.setProviderId(providerId);

        ProviderSlot created =
                providerSlotService.createSlot(request);

        return ResponseEntity.status(201).body(created);
    }

    /**
     * Update slot for a provider
     */
    @PermitAll
    @PutMapping("/provider/{providerId}/{slotId}")
    public ResponseEntity<ProviderSlot> updateSlot(
            @PathVariable Long providerId,
            @PathVariable Long slotId,
            @RequestBody ProviderSlot entity)
            throws RecordNotFoundException {

        // Enforce provider ownership
        entity.setProviderId(providerId);

        ProviderSlot updated =
                providerSlotService.updateSlot(
                        entity,
                        slotId);

        return ResponseEntity.ok(updated);
    }

    /**
     * Delete slot for a provider
     */
    @PermitAll
    @DeleteMapping("/provider/{providerId}/{slotId}")
    public ResponseEntity<String> deleteSlot(
            @PathVariable Long providerId,
            @PathVariable Long slotId)
            throws RecordNotFoundException {

        providerSlotService.deleteSlotByProvider(
                slotId,
                providerId);

        return ResponseEntity.ok(
                "Provider slot deleted successfully");
    }
}