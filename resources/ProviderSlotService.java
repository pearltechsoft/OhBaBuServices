package com.ohbabu.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import javax.annotation.security.PermitAll;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ohbabu.exception.InvalidInputException;
import com.ohbabu.exception.RecordNotFoundException;
import com.ohbabu.model.ProviderSlot;
import com.ohbabu.repository.ProviderSlotRepo;

@Service
public class ProviderSlotService {

    @Autowired
    private ProviderSlotRepo providerSlotRepo;

    private static final String NO_SLOT =
            "No Provider Slot record exists for given id";

    /**
     * Get all slots of a provider
     */
    @PermitAll
    public List<ProviderSlot> getSlotsByProviderId(Long providerId) {

        if (providerId == null) {
            throw new InvalidInputException("Provider id is mandatory");
        }

        return providerSlotRepo.findByProviderId(providerId);
    }

    /**
     * Get slot by id and provider
     */
    @PermitAll
    public ProviderSlot getSlotByIdAndProvider(Long slotId, Long providerId)
            throws RecordNotFoundException {

        if (slotId == null || providerId == null) {
            throw new InvalidInputException(
                    "Slot id and Provider id are mandatory");
        }

        Optional<ProviderSlot> slot =
                providerSlotRepo.findBySlotIdAndProviderId(
                        slotId, providerId);

        return slot.orElseThrow(
                () -> new RecordNotFoundException(NO_SLOT));
    }

    /**
     * Create slot
     */
    @PermitAll
    public ProviderSlot createSlot(ProviderSlot request) {

        if (request.getProviderId() == null) {
            throw new InvalidInputException(
                    "Provider id is mandatory");
        }

        if (request.getSlotDate() == null) {
            throw new InvalidInputException(
                    "Slot date is mandatory");
        }

        if (request.getStartTime() == null ||
            request.getEndTime() == null) {

            throw new InvalidInputException(
                    "Start time and End time are mandatory");
        }

        return providerSlotRepo.save(request);
    }

    /**
     * Update slot
     */
    @PermitAll
    public ProviderSlot updateSlot(
            ProviderSlot entity,
            Long slotId)
            throws RecordNotFoundException {

        if (slotId == null ||
            entity.getProviderId() == null) {

            throw new InvalidInputException(
                    "Slot id and Provider id are mandatory");
        }

        Optional<ProviderSlot> existing =
                providerSlotRepo.findBySlotIdAndProviderId(
                        slotId,
                        entity.getProviderId());

        if (!existing.isPresent()) {
            throw new RecordNotFoundException(NO_SLOT);
        }

        ProviderSlot updated = existing.get();

        updated.setSlotDate(entity.getSlotDate());
        updated.setStartTime(entity.getStartTime());
        updated.setEndTime(entity.getEndTime());
        updated.setSlotDurationMins(
                entity.getSlotDurationMins());
        updated.setStatus(entity.getStatus());
        updated.setBookedBy(entity.getBookedBy());
        updated.setRemarks(entity.getRemarks());

        return providerSlotRepo.save(updated);
    }

    /**
     * Delete slot
     */
    @PermitAll
    public void deleteSlotByProvider(
            Long slotId,
            Long providerId)
            throws RecordNotFoundException {

        if (slotId == null || providerId == null) {
            throw new InvalidInputException(
                    "Slot id and Provider id are mandatory");
        }

        Optional<ProviderSlot> slot =
                providerSlotRepo.findBySlotIdAndProviderId(
                        slotId,
                        providerId);

        if (slot.isPresent()) {
            providerSlotRepo.delete(slot.get());
        } else {
            throw new RecordNotFoundException(NO_SLOT);
        }
    }
    
    @PermitAll
    public List<ProviderSlot> getAvailableSlots(
            Long providerId,
            LocalDate slotDate) {

        if (providerId == null) {
            throw new InvalidInputException(
                    "Provider id is mandatory");
        }

        if (slotDate == null) {
            throw new InvalidInputException(
                    "Slot date is mandatory");
        }

        return providerSlotRepo.findByProviderIdAndSlotDateAndStatus(
                providerId,
                slotDate,
                "AVAILABLE");
    }
}